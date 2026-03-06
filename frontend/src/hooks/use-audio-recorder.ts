"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type RecordingState = "idle" | "recording" | "paused" | "stopped";

export interface AudioRecorderResult {
  state: RecordingState;
  duration: number; // seconds elapsed
  audioBlob: Blob | null;
  audioUrl: string | null;
  analyserNode: AnalyserNode | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

/**
 * Encode raw PCM Float32 samples into a WAV Blob.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Write PCM samples (clamp to 16-bit range)
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Hook that wraps the Web Audio API for voice recording in WAV format.
 * Uses ScriptProcessorNode to capture raw PCM, then encodes to WAV on stop.
 */
export function useAudioRecorder(): AudioRecorderResult {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const isPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed =
        elapsedBeforePauseRef.current +
        (Date.now() - startTimeRef.current) / 1000;
      setDuration(Math.floor(elapsed));
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;

    // Analyser for visualization
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    setAnalyserNode(analyser);

    // ScriptProcessor to capture raw PCM samples
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    samplesRef.current = [];
    isPausedRef.current = false;

    processor.onaudioprocess = (e) => {
      if (!isPausedRef.current) {
        const inputData = e.inputBuffer.getChannelData(0);
        samplesRef.current.push(new Float32Array(inputData));
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);

    setState("recording");
    elapsedBeforePauseRef.current = 0;
    setDuration(0);
    startTimer();
  }, [startTimer]);

  const pause = useCallback(() => {
    isPausedRef.current = true;
    setState("paused");
    stopTimer();
    elapsedBeforePauseRef.current +=
      (Date.now() - startTimeRef.current) / 1000;
  }, [stopTimer]);

  const resume = useCallback(() => {
    isPausedRef.current = false;
    setState("recording");
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Stop mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Encode to WAV
    const sampleRate = audioContextRef.current?.sampleRate ?? 44100;
    const totalLength = samplesRef.current.reduce((acc, s) => acc + s.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of samplesRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBlob = encodeWav(merged, sampleRate);
    setAudioBlob(wavBlob);
    setAudioUrl(URL.createObjectURL(wavBlob));

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      setAnalyserNode(null);
    }

    setState("stopped");
    stopTimer();
    if (state === "recording") {
      elapsedBeforePauseRef.current +=
        (Date.now() - startTimeRef.current) / 1000;
    }
  }, [state, stopTimer]);

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    samplesRef.current = [];
    elapsedBeforePauseRef.current = 0;
  }, [audioUrl]);

  return {
    state,
    duration,
    audioBlob,
    audioUrl,
    analyserNode,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
