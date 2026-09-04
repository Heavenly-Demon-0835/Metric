import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET is not set. Without it the server would fall back to a "
        "shared default and anyone could forge a token for any account.\n"
        "Generate one with:\n"
        '  python -c "import secrets; print(secrets.token_urlsafe(32))"\n'
        "then add it to backend/.env (see .env.example)."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days token for mobile convenience

# bcrypt hashes at most 72 bytes and raises on longer input, so reject it at
# the API boundary with a clear message instead of 500ing inside the hash call.
MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 8


def validate_password(password: str) -> str:
    """Enforce the password policy. Raises ValueError with a user-safe message."""
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Password must be at most {MAX_PASSWORD_BYTES} bytes")
    return password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Passwords stored before the length policy existed may exceed 72 bytes;
    # bcrypt raises on those rather than returning False.
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    if isinstance(encoded_jwt, bytes):
        return encoded_jwt.decode('utf-8')
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decode and verify a token. Raises jwt.InvalidTokenError on any problem."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
