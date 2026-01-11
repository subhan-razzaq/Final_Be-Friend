from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import firebase_admin
from firebase_admin import auth, credentials, firestore

from geminiPrediction import generate_discover_payload

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))


USERS_COLLECTION = "users"

SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip()

if not SERVICE_ACCOUNT_PATH:
    raise RuntimeError("FIREBASE_SERVICE_ACCOUNT_JSON missing")
if not os.path.exists(SERVICE_ACCOUNT_PATH):
    raise RuntimeError(f"service account json not found: {SERVICE_ACCOUNT_PATH}")

if not firebase_admin._apps:
    firebase_admin.initialize_app(credentials.Certificate(SERVICE_ACCOUNT_PATH))

db = firestore.client()

app = FastAPI(title="Be-Friend Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class DiscoverRequest(BaseModel):
    limit_people: int = Field(default=3, ge=1, le=10)
    limit_activities: int = Field(default=6, ge=1, le=12)


class MatchCard(BaseModel):
    uid: str
    name: str = ""
    program: str = ""
    clubs: str = ""
    interests: str = ""
    accommodations: str = ""
    photoURL: str = ""


class DiscoverResponse(BaseModel):
    activities: List[str]
    matches: List[MatchCard]


def get_current_uid(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    try:
        decoded = auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def _doc_to_user(doc) -> Dict[str, Any]:
    data = doc.to_dict() or {}
    data["uid"] = data.get("uid") or doc.id
    return data


def get_user(uid: str) -> Dict[str, Any]:
    doc = db.collection(USERS_COLLECTION).document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    return _doc_to_user(doc)


def get_candidates(exclude_uid: str, max_candidates: int = 80) -> List[Dict[str, Any]]:
    stream = db.collection(USERS_COLLECTION).limit(max_candidates + 30).stream()

    out: List[Dict[str, Any]] = []
    for doc in stream:
        u = _doc_to_user(doc)
        if u.get("uid") == exclude_uid:
            continue
        if u.get("onboarded") is not True:
            continue

        out.append(u)
        if len(out) >= max_candidates:
            break

    return out


def to_match_card(u: Dict[str, Any]) -> MatchCard:
    return MatchCard(
        uid=str(u.get("uid", "")),
        name=str(u.get("name", "")),
        program=str(u.get("program", "")),
        clubs=str(u.get("clubs", "")),
        interests=str(u.get("interests", "")),
        accommodations=str(u.get("accommodations", "")),
        photoURL=str(u.get("photoURL", "")),
    )


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/discover", response_model=DiscoverResponse)
def discover(req: DiscoverRequest, uid: str = Depends(get_current_uid)):
    me = get_user(uid)
    candidates = get_candidates(exclude_uid=uid, max_candidates=80)

    matched_uids, activities = generate_discover_payload(
        current_user=me,
        candidates=candidates,
        limit_people=req.limit_people,
        limit_activities=req.limit_activities,
    )

    candidate_map = {c.get("uid"): c for c in candidates}
    matches: List[MatchCard] = []
    for mid in matched_uids:
        if mid in candidate_map:
            matches.append(to_match_card(candidate_map[mid]))

    return DiscoverResponse(
        activities=activities[: req.limit_activities],
        matches=matches[: req.limit_people],
    )
