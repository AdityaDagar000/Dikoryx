"""Authentication API for DIKORYX / DRACARYX.

This module is intentionally aligned with the current Neon schema:

users:
  id, created_at, password_hash, agent_id, department, name, email, photo_url, username

pending_users:
  id, created_at, middle_name, surname, country, email, phone_number,
  organisation, company_auth_token, username, password_hash, name

otp_codes:
  id, expires_at, created_at, email, otp

login_logs:
  id, user_id, login_time, email, ip_address, user_agent
"""

from __future__ import annotations

import hmac
import secrets
import traceback
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request, status

from backend.auth_utils import hash_password, verify_password
from sqlalchemy import MetaData, Table, insert, inspect

from backend.database import OTPCode, PendingUser, SessionLocal, User, engine
from backend.email_service import send_otp_email

router = APIRouter()

OTP_TTL_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 60


def _generate_otp() -> str:
    return f"{secrets.randbelow(10_000):04d}"


def _otp_matches(stored: str, provided: str) -> bool:
    return hmac.compare_digest(str(stored).encode(), str(provided).encode())


def _require_str(payload: dict, key: str, label: str | None = None) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{label or key} is required",
        )
    return value.strip()


def _optional_str(payload: dict, key: str) -> str | None:
    value = payload.get(key)
    if not isinstance(value, str):
        return None
    value = value.strip()
    return value or None


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",", 1)[0].strip() or "unknown"
    return request.client.host if request.client else "unknown"


def _issue_otp(session, email: str) -> None:
    """Replace older OTPs for an email, commit, then send the email."""
    normalized_email = email.strip().lower()
    session.query(OTPCode).filter(OTPCode.email == normalized_email).delete(
        synchronize_session=False
    )

    otp = _generate_otp()
    session.add(
        OTPCode(
            email=normalized_email,
            otp=otp,
            expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
        )
    )
    session.commit()

    try:
        send_otp_email(normalized_email, otp)
    except Exception as exc:
        session.query(OTPCode).filter(OTPCode.email == normalized_email).delete(
            synchronize_session=False
        )
        session.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Verification email could not be sent. Check SMTP configuration.",
        ) from exc


def _display_name_from_pending(pending: PendingUser) -> str:
    parts = [
        getattr(pending, "name", None),
        getattr(pending, "middle_name", None),
        getattr(pending, "surname", None),
    ]
    display_name = " ".join(str(part).strip() for part in parts if part and str(part).strip())
    return display_name or str(pending.username)


def _department_from_pending(pending: PendingUser) -> str | None:
    organisation = getattr(pending, "organisation", None)
    country = getattr(pending, "country", None)
    if organisation and country:
        return f"{organisation} / {country}"
    if organisation:
        return str(organisation)
    if country:
        return str(country)
    return None


def _user_profile(user: User) -> dict:
    """Return only columns present in the current users table."""
    return {
        "status": "ok",
        "user_id": user.id,
        "agent_id": user.agent_id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "department": user.department,
        "photo_url": user.photo_url,
    }


def _write_login_log(user: User, request: Request) -> None:
    """Best-effort audit logging that adapts to the live login_logs columns."""
    audit_session = SessionLocal()
    try:
        inspector = inspect(engine)
        if "login_logs" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("login_logs")}
        values = {
            "user_id": user.id,
            "login_time": datetime.utcnow(),
            "ip_address": _client_ip(request),
            "user_agent": request.headers.get("user-agent", "unknown"),
        }

        if "email" in columns:
            values["email"] = user.email
        elif "username" in columns:
            values["username"] = user.username

        safe_values = {key: value for key, value in values.items() if key in columns}
        if not safe_values:
            return

        table = Table("login_logs", MetaData(), autoload_with=engine)
        audit_session.execute(insert(table).values(**safe_values))
        audit_session.commit()
    except Exception:
        audit_session.rollback()
        traceback.print_exc()
    finally:
        audit_session.close()


@router.post("/api/v1/signup", status_code=status.HTTP_202_ACCEPTED)
def signup(payload: dict) -> dict:
    """Create/update a pending user and send an OTP."""
    name = _require_str(payload, "name", "Name")
    username = _require_str(payload, "username", "Username")
    password = _require_str(payload, "password", "Password")
    email = _require_str(payload, "email", "Email").lower()

    middle_name = _optional_str(payload, "middle_name")
    surname = _optional_str(payload, "surname")
    country = _optional_str(payload, "country")
    phone_number = _optional_str(payload, "phone_number")
    organisation = _optional_str(payload, "organisation")
    company_auth_token = _optional_str(payload, "company_auth_token")

    session = SessionLocal()
    try:
        existing_user_by_username = (
            session.query(User).filter(User.username == username).first()
        )
        if existing_user_by_username is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="username already exists",
            )

        existing_user_by_email = session.query(User).filter(User.email == email).first()
        if existing_user_by_email is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="email already exists",
            )

        existing_pending_by_username = (
            session.query(PendingUser).filter(PendingUser.username == username).first()
        )
        if existing_pending_by_username is not None and existing_pending_by_username.email != email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="username already exists",
            )

        pending = session.query(PendingUser).filter(PendingUser.email == email).first()
        if pending is None:
            pending = PendingUser(
                name=name,
                middle_name=middle_name,
                surname=surname or "",
                country=country or "",
                email=email,
                phone_number=phone_number,
                organisation=organisation or "",
                company_auth_token=company_auth_token or "",
                username=username,
                password_hash=hash_password(password),
            )
            session.add(pending)
        else:
            pending.name = name
            pending.middle_name = middle_name
            pending.surname = surname or ""
            pending.country = country or ""
            pending.phone_number = phone_number
            pending.organisation = organisation or ""
            pending.company_auth_token = company_auth_token or ""
            pending.username = username
            pending.password_hash = hash_password(password)

        session.flush()
        _issue_otp(session, email)
        return {"status": "otp_sent", "email": email}

    except HTTPException:
        session.rollback()
        raise
    except Exception as exc:
        traceback.print_exc()
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create account",
        ) from exc
    finally:
        session.close()


@router.post("/api/v1/login", status_code=status.HTTP_202_ACCEPTED)
def login(payload: dict, request: Request) -> dict:
    """Validate username/password and send a login OTP."""
    username = _require_str(payload, "username", "Username")
    password = _require_str(payload, "password", "Password")

    session = SessionLocal()
    try:
        user = session.query(User).filter(User.username == username).first()
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )

        if not user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account has no email address on record",
            )

        email = user.email.strip().lower()
        _issue_otp(session, email)
        return {"status": "otp_sent", "email": email}

    except HTTPException:
        session.rollback()
        raise
    except Exception as exc:
        traceback.print_exc()
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to authenticate. Please try again.",
        ) from exc
    finally:
        session.close()


@router.post("/api/v1/verify-otp", status_code=status.HTTP_200_OK)
def verify_otp(payload: dict, request: Request) -> dict:
    """Verify OTP for both signup and login flows."""
    email = _require_str(payload, "email", "Email").lower()
    otp_value = _require_str(payload, "otp", "OTP")

    session = SessionLocal()
    try:
        otp_record = (
            session.query(OTPCode)
            .filter(OTPCode.email == email)
            .order_by(OTPCode.created_at.desc())
            .first()
        )
        if otp_record is None or not _otp_matches(otp_record.otp, otp_value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code",
            )

        if datetime.utcnow() > otp_record.expires_at:
            session.delete(otp_record)
            session.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new one.",
            )

        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user is not None:
            session.delete(otp_record)
            session.commit()
            _write_login_log(existing_user, request)
            return _user_profile(existing_user)

        pending = session.query(PendingUser).filter(PendingUser.email == email).first()
        if pending is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No pending registration found for this email address",
            )

        new_user = User(
            username=pending.username,
            password_hash=pending.password_hash,
            name=_display_name_from_pending(pending),
            email=pending.email,
            department=_department_from_pending(pending),
            photo_url=None,
        )
        session.add(new_user)
        session.flush()
        session.refresh(new_user)

        session.delete(pending)
        session.delete(otp_record)
        session.commit()
        return _user_profile(new_user)

    except HTTPException:
        session.rollback()
        raise
    except Exception as exc:
        traceback.print_exc()
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification failed. Please try again.",
        ) from exc
    finally:
        session.close()


@router.post("/api/v1/resend-otp", status_code=status.HTTP_202_ACCEPTED)
def resend_otp(payload: dict) -> dict:
    """Reissue an OTP for an email in either signup or login flow."""
    email = _require_str(payload, "email", "Email").lower()

    session = SessionLocal()
    try:
        user_exists = session.query(User).filter(User.email == email).first() is not None
        pending_exists = (
            session.query(PendingUser).filter(PendingUser.email == email).first()
            is not None
        )
        if not user_exists and not pending_exists:
            return {"status": "otp_sent"}

        existing_otp = session.query(OTPCode).filter(OTPCode.email == email).first()
        if existing_otp is not None and existing_otp.created_at is not None:
            age_seconds = (datetime.utcnow() - existing_otp.created_at).total_seconds()
            if age_seconds < OTP_RESEND_COOLDOWN_SECONDS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        f"Please wait {int(OTP_RESEND_COOLDOWN_SECONDS - age_seconds)} "
                        "seconds before requesting a new code."
                    ),
                )

        _issue_otp(session, email)
        return {"status": "otp_sent"}

    except HTTPException:
        session.rollback()
        raise
    except Exception as exc:
        traceback.print_exc()
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to resend OTP",
        ) from exc
    finally:
        session.close()