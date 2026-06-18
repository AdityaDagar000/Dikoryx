"""Agent identity persistence."""

from __future__ import annotations

import hashlib
import json
import os
import socket
import uuid
from typing import Any, cast

IDENTITY_FILE = os.environ.get("ITD_IDENTITY_FILE", "agent_identity.json")


def get_device_fingerprint() -> str:
    hostname = socket.gethostname()
    mac = hex(uuid.getnode())
    raw = f"{hostname}-{mac}"
    return hashlib.sha256(raw.encode()).hexdigest()


def save_identity(identity: dict[str, Any], path: str | None = None) -> dict[str, Any]:
    """Persist identity data to disk."""
    target = path or IDENTITY_FILE
    with open(target, "w", encoding="utf-8") as handle:
        json.dump(identity, handle)
    return identity


def load_or_create_identity(path: str | None = None) -> dict[str, Any]:
    """Load identity from disk or create a new local agent identity."""
    target = path or IDENTITY_FILE
    if os.path.exists(target):
        with open(target, encoding="utf-8") as handle:
            return cast(dict[str, Any], json.load(handle))

    identity = {
        "agent_id": str(uuid.uuid4()),
        "fingerprint": get_device_fingerprint(),
    }
    save_identity(identity, path=target)
    return identity
