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
 * Hook that wraps the MediaRecorder API for voice recording.
 * Provides start/stop/pause controls, elapsed time, and an AnalyserNode
 * for real-time waveform visualization.
 */
export function useAudioRecorder(): AudioRecorderResult {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);

  // Clean up object URL on unmount or when replaced
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
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Set up Web Audio API analyser for waveform visualization
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    setAnalyserNode(analyser);

    // Determine best supported format
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      // Stop all tracks to release microphone
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250); // Collect data every 250ms
    setState("recording");
    elapsedBeforePauseRef.current = 0;
    setDuration(0);
    startTimer();
  }, [startTimer]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      stopTimer();
      elapsedBeforePauseRef.current +=
        (Date.now() - startTimeRef.current) / 1000;
    }
  }, [stopTimer]);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      startTimer();
    }
  }, [startTimer]);

  const stop = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setState("stopped");
      stopTimer();
      if (state === "recording") {
        elapsedBeforePauseRef.current +=
          (Date.now() - startTimeRef.current) / 1000;
      }
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      setAnalyserNode(null);
    }
  }, [state, stopTimer]);

  const reset = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    chunksRef.current = [];
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
