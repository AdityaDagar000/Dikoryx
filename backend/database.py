"""
database.py — Production-grade SQLAlchemy models and database utilities
for the DIKORYX / DRACARYX Insider Threat Detection platform.

Schema design principles:
  - PendingUser mirrors User exactly (minus agent_id / photo_url).
  - All text columns use SQLAlchemy Text; no bare String without length.
  - Nullable is declared explicitly on every column.
  - Indexes are placed on every column used in WHERE / JOIN clauses.
  - OTPCode uses a composite index on (email, otp) for fast single-query lookup.
"""

from __future__ import annotations

# FIX: single consolidated import block — removed duplicate first block that
# imported String (unused) and caused potential NameError conflicts.
import os
import secrets
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Optional, TypedDict

from dotenv import load_dotenv
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Text,
    TIMESTAMP,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# ──────────────────────────────────────────────
# ENV
# ──────────────────────────────────────────────

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

DATABASE_URL: str = os.getenv("DATABASE_URL", "")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./test.db"
    print(
        "[DATABASE WARNING] DATABASE_URL is not set. "
        "Using local SQLite (test.db). Rows will NOT appear in Neon."
    )

# ──────────────────────────────────────────────
# ENGINE
# ──────────────────────────────────────────────

_connect_args: dict[str, Any] = (
    {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


# ──────────────────────────────────────────────
# MODELS
# ──────────────────────────────────────────────


class PendingUser(Base):
    """
    Temporary holding table for users who have submitted the signup form
    but have NOT yet verified their OTP.

    A record here must NEVER be treated as an active account.
    On successful OTP verification the row is promoted to `users`
    and deleted from this table atomically.
    """

    __tablename__ = "pending_users"

    id = Column(Integer, primary_key=True, index=True)

    # ── Identity ──────────────────────────────
    name = Column(Text, nullable=False)
    middle_name = Column(Text, nullable=True)
    surname = Column(Text, nullable=False)

    # ── Location ──────────────────────────────
    country = Column(Text, nullable=False)

    # ── Contact ───────────────────────────────
    email = Column(Text, nullable=False, index=True, unique=True)
    phone_number = Column(Text, nullable=True)

    # ── Organisation ──────────────────────────
    organisation = Column(Text, nullable=False)
    company_auth_token = Column(Text, nullable=False)

    # ── Credentials ───────────────────────────
    username = Column(Text, nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)

    # ── Timestamps ────────────────────────────
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class User(Base):
    """Fully verified active user account matching the current Neon users table."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    password_hash = Column(Text, nullable=False)
    agent_id = Column(
        Text,
        nullable=False,
        unique=True,
        index=True,
        default=lambda: f"agent-{uuid.uuid4().hex[:8]}",
    )
    department = Column(Text, nullable=True)
    name = Column(Text, nullable=False)
    email = Column(Text, nullable=False, unique=True, index=True)
    photo_url = Column(Text, nullable=True)
    username = Column(Text, nullable=False, unique=True, index=True)

class OTPCode(Base):
    """
    One-time passwords used for both signup verification and login MFA.

    Lifecycle:
      - Created when OTP is issued (older codes for same email are deleted first).
      - Consumed (deleted) on successful verification.
      - TTL enforced in application logic via `expires_at`.

    The composite index on (email, otp) makes the verify lookup a single
    index scan.
    """

    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(Text, nullable=False, index=True)
    otp = Column(Text, nullable=False)
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_otp_codes_email_otp", "email", "otp"),
    )


class LoginLog(Base):
    """Append-only audit log for every successful OTP verification (login)."""

    __tablename__ = "login_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    username = Column(Text, nullable=True)
    login_time = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)
    ip_address = Column(Text, nullable=True)
    user_agent = Column(Text, nullable=True)


# ──────────────────────────────────────────────
# AGENT / ORGANISATION MODELS
# ──────────────────────────────────────────────


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    enrollment_token = Column(Text, nullable=False, unique=True, index=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(Text, primary_key=True)
    organization_id = Column(
        Integer,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True,
    )
    hostname = Column(Text, nullable=True)
    os = Column(Text, nullable=True)
    last_seen = Column(TIMESTAMP, nullable=True)
    api_key = Column(Text, nullable=False, unique=True, index=True)


# ──────────────────────────────────────────────
# TELEMETRY MODELS
# ──────────────────────────────────────────────


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Text, nullable=False, index=True)
    event_type = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class RiskLog(Base):
    __tablename__ = "risk_logs"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Text, nullable=False, index=True)
    risk_score = Column(Integer, nullable=True)
    risk_level = Column(Text, nullable=True)
    reasons = Column(JSON, nullable=True)
    signals = Column(JSON, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


class DlpAlert(Base):
    __tablename__ = "dlp_alerts"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Text, nullable=False, index=True)
    alert_type = Column(Text, nullable=True)
    severity = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, default=datetime.utcnow)


# ──────────────────────────────────────────────
# TYPED DICTS
# ──────────────────────────────────────────────


class PendingEvent(TypedDict):
    agent_id: str
    event_type: str | None
    data: dict[str, Any]


class AgentRegistrationResult(TypedDict):
    agent_id: str
    api_key: str


class AgentRecord(TypedDict):
    agent_id: str
    organization_id: int
    hostname: str | None
    os: str | None
    api_key: str


class OrganizationRecord(TypedDict):
    id: int
    name: str
    enrollment_token: str
    created_at: datetime


# ──────────────────────────────────────────────
# CUSTOM EXCEPTIONS
# ──────────────────────────────────────────────


class OrganizationNotFoundError(Exception):
    """Raised when enrollment_token does not match any organization."""


class OrganizationIdNotFoundError(Exception):
    """Raised when an organization id does not exist."""


# ──────────────────────────────────────────────
# INIT
# ──────────────────────────────────────────────


def init_db() -> None:
    """Create all tables that do not yet exist. Safe to call on every startup."""
    Base.metadata.create_all(bind=engine)


# ──────────────────────────────────────────────
# INTERNAL HELPERS
# ──────────────────────────────────────────────


def _should_commit(commit: bool | None, owns_session: bool) -> bool:
    if commit is not None:
        return commit
    return owns_session


def _new_agent_id() -> str:
    return f"agent-{uuid.uuid4().hex[:12]}"


def _new_api_key() -> str:
    return secrets.token_urlsafe(32)


def _new_enrollment_token() -> str:
    return secrets.token_urlsafe(32)


def _agent_record(agent: Agent) -> AgentRecord:
    return AgentRecord(
        agent_id=str(agent.agent_id),
        organization_id=int(agent.organization_id),
        hostname=str(agent.hostname) if agent.hostname is not None else None,
        os=str(agent.os) if agent.os is not None else None,
        api_key=str(agent.api_key),
    )


def _organization_record(org: Organization) -> OrganizationRecord:
    created_at_raw = org.created_at
    created_at = (
        created_at_raw
        if isinstance(created_at_raw, datetime)
        else datetime.utcnow()
    )
    return OrganizationRecord(
        id=int(org.id),
        name=str(org.name),
        enrollment_token=str(org.enrollment_token),
        created_at=created_at,
    )


# ──────────────────────────────────────────────
# EVENT HELPERS
# ──────────────────────────────────────────────


def bulk_save_events(
    records: list[PendingEvent],
    *,
    session: Session | None = None,
    commit: bool | None = None,
) -> None:
    if not records:
        return
    owns_session = session is None
    db = session or SessionLocal()
    try:
        db.add_all(
            Event(
                agent_id=record["agent_id"],
                event_type=record["event_type"],
                data=record["data"],
            )
            for record in records
        )
        if _should_commit(commit, owns_session):
            db.commit()
    except Exception as exc:
        db.rollback()
        print("[DB ERROR]", exc)
    finally:
        if owns_session:
            db.close()


def save_event(
    agent_id: str,
    event_type: str | None,
    data: dict[str, Any],
    *,
    session: Session | None = None,
    commit: bool | None = None,
) -> None:
    bulk_save_events(
        [{"agent_id": agent_id, "event_type": event_type, "data": data}],
        session=session,
        commit=commit,
    )


# ──────────────────────────────────────────────
# RISK LOG HELPERS
# ──────────────────────────────────────────────


def save_risk_log(
    agent_id: str,
    risk_score: int,
    risk_level: str,
    reasons: Any,
    signals: Any,
    *,
    session: Session | None = None,
    commit: bool | None = None,
) -> None:
    owns_session = session is None
    db = session or SessionLocal()
    try:
        db.add(
            RiskLog(
                agent_id=agent_id,
                risk_score=risk_score,
                risk_level=risk_level,
                reasons=reasons,
                signals=signals,
            )
        )
        if _should_commit(commit, owns_session):
            db.commit()
    except Exception as exc:
        db.rollback()
        print("[RISK LOG ERROR]", exc)
    finally:
        if owns_session:
            db.close()


# ──────────────────────────────────────────────
# DLP ALERT HELPERS
# ──────────────────────────────────────────────

DLP_DEDUP_SECONDS = 300


def save_dlp_alerts(agent_id: str, alerts: list) -> int:
    if not alerts:
        return 0

    session = SessionLocal()
    saved = 0
    try:
        cutoff = datetime.utcfromtimestamp(time.time() - DLP_DEDUP_SECONDS)
        for alert in alerts:
            alert_type = alert.get("type")
            severity = alert.get("severity")
            reason = alert.get("reason")
            if not alert_type or not severity:
                continue
            recent = (
                session.query(DlpAlert)
                .filter(
                    DlpAlert.agent_id == agent_id,
                    DlpAlert.alert_type == alert_type,
                    DlpAlert.severity == severity,
                    DlpAlert.created_at >= cutoff,
                )
                .first()
            )
            if recent:
                continue
            session.add(
                DlpAlert(
                    agent_id=agent_id,
                    alert_type=alert_type,
                    severity=severity,
                    reason=reason,
                )
            )
            saved += 1
        if saved:
            session.commit()
    except Exception as exc:
        session.rollback()
        print("[DLP ALERT ERROR]", exc)
    finally:
        session.close()
    return saved


def get_dlp_alerts(agent_id: str | None = None, limit: int = 100) -> list:
    session = SessionLocal()
    try:
        q = session.query(DlpAlert).order_by(DlpAlert.created_at.desc())
        if agent_id:
            q = q.filter(DlpAlert.agent_id == agent_id)
        rows = q.limit(limit).all()
        return [
            {
                "id": row.id,
                "agent_id": row.agent_id,
                "type": row.alert_type,
                "severity": row.severity,
                "reason": row.reason,
                "timestamp": (
                    row.created_at.timestamp() if row.created_at else None
                ),
            }
            for row in rows
        ]
    finally:
        session.close()


# ──────────────────────────────────────────────
# AGENT HELPERS
# ──────────────────────────────────────────────


def get_agent_by_api_key(api_key: str) -> Optional[AgentRecord]:
    session = SessionLocal()
    try:
        agent = session.query(Agent).filter(Agent.api_key == api_key).first()
        return _agent_record(agent) if agent else None
    finally:
        session.close()


def touch_agent_last_seen(agent_id: str) -> None:
    session = SessionLocal()
    try:
        agent = session.query(Agent).filter(Agent.agent_id == agent_id).first()
        if agent is None:
            return
        agent.last_seen = datetime.utcnow()  # type: ignore[assignment]
        session.commit()
    except Exception as exc:
        session.rollback()
        print("[AGENT TOUCH ERROR]", exc)
    finally:
        session.close()


# ──────────────────────────────────────────────
# ORGANISATION HELPERS
# ──────────────────────────────────────────────


def create_organization(name: str) -> OrganizationRecord:
    session = SessionLocal()
    try:
        org = Organization(name=name, enrollment_token=_new_enrollment_token())
        session.add(org)
        session.commit()
        session.refresh(org)
        return _organization_record(org)
    except Exception as exc:
        session.rollback()
        print("[ORG CREATE ERROR]", exc)
        raise
    finally:
        session.close()


def list_organizations() -> list[OrganizationRecord]:
    session = SessionLocal()
    try:
        rows = session.query(Organization).order_by(Organization.id.asc()).all()
        return [_organization_record(row) for row in rows]
    finally:
        session.close()


def get_organization_by_id(org_id: int) -> OrganizationRecord:
    session = SessionLocal()
    try:
        org = (
            session.query(Organization)
            .filter(Organization.id == org_id)
            .first()
        )
        if org is None:
            raise OrganizationIdNotFoundError(f"Organization {org_id} not found")
        return _organization_record(org)
    finally:
        session.close()


def register_agent(
    enrollment_token: str,
    hostname: str,
    os_name: str,
) -> AgentRegistrationResult:
    session = SessionLocal()
    try:
        organization = (
            session.query(Organization)
            .filter(Organization.enrollment_token == enrollment_token)
            .first()
        )
        if organization is None:
            raise OrganizationNotFoundError("Invalid enrollment token")

        now = datetime.utcnow()
        agent = Agent(
            agent_id=_new_agent_id(),
            organization_id=organization.id,
            hostname=hostname,
            os=os_name,
            last_seen=now,
            api_key=_new_api_key(),
        )
        session.add(agent)
        session.commit()
        session.refresh(agent)
        return AgentRegistrationResult(
            agent_id=str(agent.agent_id),
            api_key=str(agent.api_key),
        )
    except OrganizationNotFoundError:
        session.rollback()
        raise
    except Exception as exc:
        session.rollback()
        print("[AGENT REGISTER ERROR]", exc)
        raise
    finally:
        session.close()
