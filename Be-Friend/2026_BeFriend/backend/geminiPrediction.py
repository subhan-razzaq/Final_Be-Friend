from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(Path(__file__).with_name(".env"))

_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not _GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is missing")

# Long-lived client to avoid “client closed” issues
_CLIENT = genai.Client(api_key=_GEMINI_API_KEY)


# -----------------------
# Helpers
# -----------------------

_WORD_RE = re.compile(r"[a-z0-9]+")


def _tokens(s: str) -> set[str]:
    s = (s or "").lower()
    toks = set(_WORD_RE.findall(s))
    # tiny stopword prune
    stop = {
        "and",
        "or",
        "the",
        "a",
        "an",
        "to",
        "of",
        "in",
        "for",
        "with",
        "on",
        "at",
        "from",
        "is",
        "are",
        "be",
        "this",
        "that",
        "i",
        "me",
        "my",
        "we",
        "us",
        "you",
        "your",
        "it",
        "as",
        "by",
        "into",
        "etc",
        "mcmaster",
        "mac",
        "student",
        "students",
    }
    return {t for t in toks if t not in stop and len(t) >= 2}


def _compact_user(u: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "uid": str(u.get("uid", "")).strip(),
        "name": str(u.get("name", "")).strip(),
        "program": str(u.get("program", "")).strip(),
        "clubs": str(u.get("clubs", "")).strip(),
        "interests": str(u.get("interests", "")).strip(),
        "accommodations": str(u.get("accommodations", "")).strip(),
    }


def _similarity_score(me: Dict[str, Any], c: Dict[str, Any]) -> float:
    # Quick & surprisingly effective heuristic:
    # overlap in clubs/interests/program, plus accommodation compatibility
    me_prog = _tokens(me.get("program", ""))
    me_clubs = _tokens(me.get("clubs", ""))
    me_int = _tokens(me.get("interests", ""))
    me_acc = _tokens(me.get("accommodations", ""))

    c_prog = _tokens(c.get("program", ""))
    c_clubs = _tokens(c.get("clubs", ""))
    c_int = _tokens(c.get("interests", ""))
    c_acc = _tokens(c.get("accommodations", ""))

    prog_overlap = len(me_prog & c_prog)
    clubs_overlap = len(me_clubs & c_clubs)
    int_overlap = len(me_int & c_int)

    score = 0.0
    score += 1.5 * prog_overlap
    score += 2.5 * clubs_overlap
    score += 1.0 * int_overlap

    # accommodations: if me has accommodations, prefer candidates who mention compatible needs
    if me_acc:
        acc_overlap = len(me_acc & c_acc)
        score += 2.0 * acc_overlap
        if not c_acc:
            score -= 0.5  # slight penalty if they say nothing

    return score


def _extract_json_object(text: str) -> str:
    """
    Gemini sometimes returns extra whitespace or stray text.
    This extracts the first {...} block safely.
    """
    if not text:
        raise ValueError("Empty model response")

    s = text.strip()
    if s.startswith("{") and s.endswith("}"):
        return s

    start = s.find("{")
    end = s.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in model output")

    return s[start : end + 1]


def _format_activity_lines(activities: List[Dict[str, Any]], limit_activities: int) -> List[str]:
    out: List[str] = []
    for a in activities[:limit_activities]:
        title = str(a.get("title", "")).strip()
        location = str(a.get("location", "")).strip()
        why = str(a.get("whyItWorks", "")).strip()
        notes = str(a.get("accessibilityNotes", "")).strip()

        if not title:
            continue

        line = title
        if location:
            line += f" — {location}"
        if why:
            line += f" • {why}"
        if notes:
            line += f" • Accessibility: {notes}"

        out.append(line.strip())
    return out


def _fallback(me: Dict[str, Any], candidates: List[Dict[str, Any]], limit_people: int, limit_activities: int):
    # IMPORTANT: fallback should be “best match”, not “first N”
    scored = []
    for c in candidates:
        uid = str(c.get("uid", "")).strip()
        if not uid:
            continue
        scored.append((uid, _similarity_score(me, c)))

    scored.sort(key=lambda x: x[1], reverse=True)
    matched_uids = [uid for uid, _ in scored[:limit_people]]

    fallback_activities = [
        "Board games in a quiet study room — Mills Library • Easy to coordinate and low-noise • Accessibility: pick well-lit seating",
        "Campus coffee chat — Starbucks (MUSC) • Low-pressure hangout • Accessibility: avoid peak rush times",
        "Walk + talk loop — McMaster campus trails • Casual and flexible • Accessibility: choose paved routes",
        "Study session — Thode Library • Productive and social • Accessibility: reserve a quieter area",
        "Lunch meetup — Student Centre food court • Simple and convenient • Accessibility: pick seating away from speakers",
        "Farmers Market trip — Hamilton Farmers’ Market • Great for conversation • Accessibility: go during quieter hours",
        "Pulse gym session — DBAC • Easy shared activity • Accessibility: choose quiet hours",
        "Cootes Paradise walk — Trails near campus • Relaxed + scenic • Accessibility: choose flatter trail sections",
    ][:limit_activities]

    # Ensure exact counts even in edge cases
    if len(matched_uids) < limit_people:
        # fill deterministically from remaining candidates
        all_uids = [str(c.get("uid", "")).strip() for c in candidates if str(c.get("uid", "")).strip()]
        for uid in all_uids:
            if uid not in matched_uids:
                matched_uids.append(uid)
            if len(matched_uids) >= limit_people:
                break

    return matched_uids[:limit_people], fallback_activities[:limit_activities]


def generate_discover_payload(
    current_user: Dict[str, Any],
    candidates: List[Dict[str, Any]],
    limit_people: int = 3,
    limit_activities: int = 6,
) -> Tuple[List[str], List[str]]:
    me = _compact_user(current_user)
    compact_candidates = [_compact_user(c) for c in candidates]

    allowed_uids = [c["uid"] for c in compact_candidates if c.get("uid")]
    allowed_set = set(allowed_uids)
    if not allowed_uids:
        return [], []

    # Pre-rank candidates so Gemini has a better set to choose from (and your fallback is strong)
    ranked = sorted(
        compact_candidates,
        key=lambda c: _similarity_score(me, c),
        reverse=True,
    )

    # Give Gemini only the top slice to reduce hallucinations and improve accuracy
    top_k = max(20, limit_people * 10)
    ranked = ranked[: min(top_k, len(ranked))]

    system_rules = f"""
You match McMaster students into potential friends and suggest activities near McMaster University.

Return ONLY a single JSON object. No markdown. No extra text. No trailing commas.
Use exactly these keys: recommendedPeople, activities.

JSON shape:
{{
  "recommendedPeople": [
    {{ "uid": "string", "matchScore": 0.0, "why": "short reason" }}
  ],
  "activities": [
    {{ "title": "string", "location": "string", "whyItWorks": "string", "accessibilityNotes": "string" }}
  ]
}}

Hard constraints:
- Output exactly {limit_people} recommendedPeople.
- Every recommendedPeople[i].uid MUST be one of the provided candidate uids.
- Output exactly {limit_activities} activities realistically doable on/near McMaster University (Hamilton, ON).
- Respect current user's accommodations in matching and activity design.
- Keep "why" and "whyItWorks" short and natural.
"""

    prompt_obj = {
        "area": "Near McMaster University, Hamilton ON",
        "limits": {"people": limit_people, "activities": limit_activities},
        "currentUser": me,
        "candidateUids": [c["uid"] for c in ranked],
        "candidates": ranked,
        "instruction": "Return the JSON object now.",
    }

    last_err: Exception | None = None

    # Retry to avoid transient “sometimes Gemini returns non-JSON” failures
    for attempt in range(3):
        try:
            resp = _CLIENT.models.generate_content(
                model="gemini-2.5-flash",
                contents=json.dumps(prompt_obj, ensure_ascii=False),
                config=types.GenerateContentConfig(
                    system_instruction=system_rules,
                    temperature=0.25,
                    max_output_tokens=1400,
                    # Huge reliability improvement: makes model speak JSON
                    response_mime_type="application/json",
                ),
            )

            raw = (resp.text or "").strip()
            raw_json = _extract_json_object(raw)
            parsed = json.loads(raw_json)

            rec_people = parsed.get("recommendedPeople") or []
            activities = parsed.get("activities") or []

            # Enforce uids are from candidates, unique, and exact count
            matched_uids: List[str] = []
            seen = set()
            for p in rec_people:
                uid = str((p or {}).get("uid", "")).strip()
                if not uid or uid not in allowed_set or uid in seen:
                    continue
                seen.add(uid)
                matched_uids.append(uid)
                if len(matched_uids) >= limit_people:
                    break

            # If Gemini under-delivers or gives bad uids, fill with top heuristic matches
            if len(matched_uids) < limit_people:
                # Use ranked list (already best matches first)
                for c in ranked:
                    uid = c["uid"]
                    if uid and uid not in seen and uid in allowed_set:
                        matched_uids.append(uid)
                        seen.add(uid)
                    if len(matched_uids) >= limit_people:
                        break

            activity_lines = _format_activity_lines(activities, limit_activities)

            # Ensure exact activity count (fill if needed)
            if len(activity_lines) < limit_activities:
                _, fb_acts = _fallback(me, compact_candidates, limit_people, limit_activities)
                for x in fb_acts:
                    if len(activity_lines) >= limit_activities:
                        break
                    if x not in activity_lines:
                        activity_lines.append(x)

            return matched_uids[:limit_people], activity_lines[:limit_activities]

        except Exception as e:
            last_err = e
            time.sleep(0.2 * (attempt + 1))

    # If all retries fail, use strong heuristic fallback (NOT first N)
    return _fallback(me, compact_candidates, limit_people, limit_activities)
