from fastapi import APIRouter
from typing import Dict, Any, List
import time

from backend.risk_engine import compute_risk
from backend.database import save_event, save_risk_log

router = APIRouter()
print("INGEST API CALLED")

# In-memory system state
SYSTEM_STATE: Dict[str, Dict[str, Any]] = {}


@router.post("/api/v1/ingest")
async def ingest_events(payload: Dict[str, Any]):
    agent_id = payload.get("agent_id")
    print("INGEST HIT", agent_id)
    events: List[Dict[str, Any]] = payload.get("events", [])

    if not agent_id:
        return {"status": "error", "reason": "agent_id missing"}

    system = SYSTEM_STATE.setdefault(agent_id, {
        "agent_id": agent_id,
        "last_seen": None,
        "usb": {},
        "vpn": {},
        "auth": {"logins": 0, "last_user": None},
        "events": []
    })

    system["last_seen"] = time.time()
    system["os"] = payload.get("os", {})

    # Save heartbeat
    save_event(agent_id, "HEARTBEAT", payload)

    for event in events:
        event_type = event.get("event_type") or "UNKNOWN"

        # Store in memory
        system["events"].append(event)

        # Save raw event to DB
        save_event(agent_id, event_type, event)

        # ---------- AUTH ----------
        if event_type == "USER_LOGIN":
            system["auth"]["logins"] += 1
            system["auth"]["last_user"] = event.get("username")

        # ---------- VPN ----------
        elif event_type == "VPN_EVENT":
            system["vpn"] = event.get("vpn_info", {})

        # ---------- USB ----------
        elif event_type == "USB_EVENT":
            system["usb"] = {
                "mount": event.get("mount"),
                "summary": event.get("summary"),
                "last_seen": event.get("timestamp")
            }

    # -------- RISK ENGINE --------
    risk = compute_risk(agent_id, system["events"], system)

    # -------- SAVE RISK LOG --------
    save_risk_log(
        agent_id=risk["agent_id"],
        risk_score=risk["risk_score"],
        risk_level=risk["risk_level"],
        reasons=risk["reasons"],
        signals=risk.get("signals", {})
        
    )

    return {
        "status": "ok",
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"]
    }


@router.get("/api/v1/system/{agent_id}")
async def get_system(agent_id: str):
    system = SYSTEM_STATE.get(agent_id)

    if not system:
        return {"error": "agent not found"}

    return system