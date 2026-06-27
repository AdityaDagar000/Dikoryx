"""Endpoint agent simulator for Dikoryx performance and scalability tests."""

from __future__ import annotations

import random
import time
import uuid
from dataclasses import dataclass
from typing import Any

import requests

ORGANIZATIONS: tuple[tuple[int, str], ...] = (
    (1, "Acme Corp"),
    (2, "Globex Industries"),
    (3, "Initech"),
    (4, "Umbrella Systems"),
    (5, "Wayne Enterprises"),
)
HOSTNAME_PREFIXES: tuple[str, ...] = ("ws", "laptop", "desktop", "vm", "dev")
PROCESS_NAMES: tuple[str, ...] = (
    "chrome.exe",
    "outlook.exe",
    "explorer.exe",
    "teams.exe",
    "powershell.exe",
    "excel.exe",
    "winword.exe",
    "notepad.exe",
)
SENSITIVE_FILES: tuple[str, ...] = (
    "salary.csv",
    "payroll.xlsx",
    "finance_report.pdf",
    "customer_list.xlsx",
    "employee_records.docx",
)
SEVERITIES: tuple[str, ...] = ("LOW", "MEDIUM", "HIGH")
COMPLIANCE_CONTROLS: tuple[str, ...] = (
    "firewall_enabled",
    "screen_lock_enabled",
    "usb_storage_disabled",
    "antivirus_running",
    "disk_encryption_enabled",
)


@dataclass(frozen=True)
class SimulatedAgent:
    agent_id: str
    hostname: str
    username: str
    organization_id: int
    organization: str
    fingerprint: str
    session_id: str

    @classmethod
    def create(cls, *, index: int | None = None) -> SimulatedAgent:
        org_id, org_name = random.choice(ORGANIZATIONS)
        suffix = index if index is not None else random.randint(1000, 99999)
        prefix = random.choice(HOSTNAME_PREFIXES)
        hostname = f"{prefix}-{suffix}.corp.local"
        return cls(
            agent_id=str(uuid.uuid4()),
            hostname=hostname,
            username=f"user{suffix}",
            organization_id=org_id,
            organization=org_name,
            fingerprint=str(uuid.uuid4()),
            session_id=str(uuid.uuid4()),
        )

    def os_info(self) -> dict[str, Any]:
        return {
            "os": "Windows",
            "version": "10.0.26200",
            "username": self.username,
            "hostname": self.hostname,
            "organization_id": self.organization_id,
            "organization": self.organization,
        }

    def heartbeat_payload(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "fingerprint": self.fingerprint,
            "session_id": self.session_id,
            "timestamp": _random_timestamp(),
            "hostname": self.hostname,
            "os": self.os_info(),
        }

    def telemetry_payload(self, *, min_events: int = 3, max_events: int = 8) -> dict[str, Any]:
        count = random.randint(min_events, max_events)
        generators = (
            self.file_activity_event,
            self.process_activity_event,
            self.clipboard_activity_event,
            self.network_activity_event,
            self.compliance_report_event,
            self.dlp_signal_event,
        )
        events = [random.choice(generators)() for _ in range(count)]
        return {
            "agent_id": self.agent_id,
            "fingerprint": self.fingerprint,
            "session_id": self.session_id,
            "events": events,
        }

    def file_activity_event(self) -> dict[str, Any]:
        write_count = random.randint(1, 250)
        delete_count = random.randint(0, 40)
        rename_count = random.randint(0, 20)
        total = write_count + delete_count + rename_count
        summary: dict[str, Any] = {
            "write": write_count,
            "delete": delete_count,
            "rename": rename_count,
        }
        if random.random() < 0.3:
            summary["sensitive_files"] = random.sample(
                list(SENSITIVE_FILES),
                k=random.randint(1, min(3, len(SENSITIVE_FILES))),
            )
        return {
            "event_type": "FILE_ACTIVITY_SUMMARY",
            "summary": summary,
            "severity": _severity(total, low=50, medium=200),
            "timestamp": _random_timestamp(),
            "os": self.os_info(),
        }

    def process_activity_event(self) -> dict[str, Any]:
        process_count = random.randint(3, len(PROCESS_NAMES))
        summary = {
            name: random.randint(1, 15)
            for name in random.sample(list(PROCESS_NAMES), k=process_count)
        }
        total = sum(summary.values())
        return {
            "event_type": "PROCESS_ACTIVITY_SUMMARY",
            "summary": summary,
            "severity": _severity(total, low=20, medium=50),
            "timestamp": _random_timestamp(),
        }

    def clipboard_activity_event(self) -> dict[str, Any]:
        copy_events = random.randint(0, 45)
        summary = {
            "copy_events": copy_events,
            "small": random.randint(0, copy_events),
            "medium": random.randint(0, max(0, copy_events // 2)),
            "large": random.randint(0, 2),
        }
        return {
            "event_type": "CLIPBOARD_ACTIVITY_SUMMARY",
            "summary": summary,
            "severity": _severity(copy_events, low=10, medium=30),
            "timestamp": _random_timestamp(),
        }

    def network_activity_event(self) -> dict[str, Any]:
        bytes_sent = random.randint(1_000, 12_000_000)
        bytes_received = random.randint(500, 4_000_000)
        direction = "UPLOAD_HEAVY" if bytes_sent > 2 * bytes_received else "BALANCED"
        return {
            "event_type": "NETWORK_ACTIVITY_SUMMARY",
            "summary": {
                "bytes_sent": bytes_sent,
                "bytes_received": bytes_received,
                "connections": random.randint(1, 40),
                "direction": direction,
            },
            "severity": _severity(bytes_sent, low=5_000_000, medium=50_000_000),
            "timestamp": _random_timestamp(),
        }

    def compliance_report_event(self) -> dict[str, Any]:
        controls = {name: random.random() > 0.2 for name in COMPLIANCE_CONTROLS}
        passed = sum(1 for enabled in controls.values() if enabled)
        score = int((passed / len(COMPLIANCE_CONTROLS)) * 100)
        enforced = [name for name, enabled in controls.items() if not enabled][:2]
        event: dict[str, Any] = {
            "event_type": "COMPLIANCE_STATUS",
            "controls": controls,
            "compliance_score": score,
            "timestamp": _random_timestamp(),
            "os": self.os_info(),
        }
        if enforced:
            event["enforced"] = enforced
        return event

    def dlp_signal_event(self) -> dict[str, Any]:
        variant = random.choice(
            ("clipboard_spike", "sensitive_files", "usb_exfil", "network_exfil")
        )
        timestamp = _random_timestamp()
        if variant == "clipboard_spike":
            return {
                "event_type": "CLIPBOARD_ACTIVITY_SUMMARY",
                "summary": {
                    "copy_events": random.randint(25, 60),
                    "paste_events": random.randint(0, 10),
                },
                "severity": "HIGH",
                "timestamp": timestamp,
            }
        if variant == "sensitive_files":
            return {
                "event_type": "FILE_ACTIVITY_SUMMARY",
                "summary": {
                    "write": random.randint(10, 50),
                    "sensitive_files": random.sample(list(SENSITIVE_FILES), k=2),
                },
                "severity": "HIGH",
                "timestamp": timestamp,
            }
        if variant == "usb_exfil":
            return {
                "event_type": "USB_REALTIME",
                "mount": random.choice(("E:\\", "F:\\")),
                "action": "inserted",
                "intel": {
                    "risk": random.choice(SEVERITIES),
                    "suspicious_files": random.sample(list(SENSITIVE_FILES), k=1),
                },
                "timestamp": timestamp,
            }
        return {
            "event_type": "NETWORK_ACTIVITY_SUMMARY",
            "summary": {
                "bytes_sent": random.randint(8_000, 20_000),
                "bytes_received": random.randint(500, 2_000),
            },
            "severity": "HIGH",
            "timestamp": timestamp,
        }

    def send_heartbeat(
        self,
        session: requests.Session,
        base_url: str,
        *,
        timeout: float = 10.0,
    ) -> tuple[bool, float, int | None, str | None]:
        return _post_json(
            session,
            f"{base_url.rstrip('/')}/api/v1/ingest/heartbeat",
            self.heartbeat_payload(),
            timeout=timeout,
            success_check=lambda body: body.get("status") == "alive",
        )

    def send_telemetry(
        self,
        session: requests.Session,
        base_url: str,
        *,
        timeout: float = 10.0,
    ) -> tuple[bool, float, int | None, str | None]:
        payload = self.telemetry_payload()
        return _post_json(
            session,
            f"{base_url.rstrip('/')}/api/v1/ingest",
            payload,
            timeout=timeout,
            success_check=lambda body: body.get("status") == "ok",
        )


def create_agents(count: int) -> list[SimulatedAgent]:
    return [SimulatedAgent.create(index=10_000 + index) for index in range(count)]


def _post_json(
    session: requests.Session,
    url: str,
    payload: dict[str, Any],
    *,
    timeout: float,
    success_check,
) -> tuple[bool, float, int | None, str | None]:
    start = time.perf_counter()
    try:
        response = session.post(url, json=payload, timeout=timeout)
        latency_ms = (time.perf_counter() - start) * 1000
        if response.status_code != 200:
            return False, latency_ms, response.status_code, f"HTTP {response.status_code}"
        body = response.json()
        if not success_check(body):
            return False, latency_ms, response.status_code, "unexpected response body"
        return True, latency_ms, response.status_code, None
    except requests.RequestException as exc:
        latency_ms = (time.perf_counter() - start) * 1000
        return False, latency_ms, None, str(exc)


def _random_timestamp(max_age_seconds: float = 300.0) -> float:
    return time.time() - random.uniform(0, max_age_seconds)


def _severity(total: int, *, low: int, medium: int) -> str:
    if total > medium:
        return "HIGH"
    if total > low:
        return "MEDIUM"
    return "LOW"
