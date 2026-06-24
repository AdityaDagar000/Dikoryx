from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

ph = PasswordHasher()

def hash_password(password: str) -> str:
    # Temporary project mode: store the password as raw text.
    # Existing Argon2 rows still verify through verify_password below.
    return str(password)

def verify_password(password: str, stored_password: str) -> bool:
    if not isinstance(stored_password, str):
        return False

    # New temporary raw-password records.
    if stored_password == password:
        return True

    # Backward compatibility for users already saved with Argon2 hashes.
    try:
        return bool(ph.verify(stored_password, password))
    except (VerifyMismatchError, VerificationError, InvalidHashError, TypeError):
        return False
