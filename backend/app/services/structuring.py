import json
import logging

from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a memory structuring assistant. Given a transcript from a voice note, you must:

1. Classify the memory type as one of: "idea", "task", or "note"
   - idea: creative thoughts, concepts, plans, brainstorming
   - task: action items, to-dos, things to do, reminders
   - note: observations, facts, reflections, logs, journal entries

2. Extract a concise title (max 10 words)

3. Write a clean, structured summary of the content (fix grammar, remove filler words, organize clearly)

4. Extract relevant tags (1-5 tags, lowercase, single words or short phrases)

5. For tasks: extract specific action items as a list

Respond ONLY with valid JSON in this exact format:
{
  "type": "idea" | "task" | "note",
  "title": "string",
  "content": "string (cleaned up summary)",
  "tags": ["tag1", "tag2"],
  "action_items": ["item1", "item2"] // only for tasks, empty array otherwise
}"""


async def structure_transcript(transcript: str) -> dict:
    """
    Use an LLM to convert raw transcript text into a structured memory.
    Returns dict with type, title, content, tags, and action_items.
    """
    if not settings.openai_api_key:
        logger.warning("No OpenAI API key — returning fallback structure")
        return _fallback_structure(transcript)

    client = OpenAI(api_key=settings.openai_api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Transcript:\n\n{transcript}"},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        result = json.loads(raw)

        # Validate required fields
        memory_type = result.get("type", "note")
        if memory_type not in ("idea", "task", "note"):
            memory_type = "note"

        structured = {
            "type": memory_type,
            "title": result.get("title", "Untitled Memory")[:100],
            "content": result.get("content", transcript),
            "tags": result.get("tags", [])[:10],
            "action_items": result.get("action_items", []) if memory_type == "task" else [],
        }

        logger.info(
            "Structured memory: type=%s, title='%s', tags=%s",
            structured["type"], structured["title"], structured["tags"],
        )
        return structured

    except Exception as e:
        logger.error("LLM structuring failed: %s", e)
        return _fallback_structure(transcript)


def _fallback_structure(transcript: str) -> dict:
    """Simple heuristic-based fallback when LLM is unavailable."""
    lower = transcript.lower()

    # Basic type detection from keywords
    if any(kw in lower for kw in ["todo", "need to", "should", "must", "reminder", "don't forget"]):
        memory_type = "task"
    elif any(kw in lower for kw in ["idea", "what if", "maybe we could", "imagine", "concept"]):
        memory_type = "idea"
    else:
        memory_type = "note"

    # Use first sentence or first 60 chars as title
    title = transcript.split(".")[0].strip()
    if len(title) > 60:
        title = title[:57] + "..."

    return {
        "type": memory_type,
        "title": title or "Untitled Memory",
        "content": transcript,
        "tags": [],
        "action_items": [],
    }
