"""Minimal in-process rate limiter for the authentication endpoints.

Deliberately dependency-free and per-process: with multiple workers each gets
its own window, so this raises the cost of credential stuffing without being an
authoritative control. Move the counters to Redis if the deployment ever runs
more than one process.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

_hits: dict[str, deque[float]] = defaultdict(deque)

# Keys are pruned lazily; this bounds the dict when many IPs go quiet.
_PURGE_EVERY = 512
_calls_since_purge = 0


def client_ip(request: Request) -> str:
    """Best-effort client IP.

    X-Forwarded-For is client-controlled unless a proxy overwrites it. Railway
    does, so the left-most entry is trustworthy there; the direct peer address
    is the fallback for local runs.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _purge(now: float, window_seconds: int) -> None:
    for key in [k for k, v in _hits.items() if not v or now - v[-1] > window_seconds]:
        del _hits[key]


def rate_limit(key: str, limit: int, window_seconds: int) -> None:
    """Allow `limit` calls per `window_seconds` for `key`, else raise 429.

    Rate limiting is keyed on IP rather than on the submitted email so that an
    attacker cannot lock a known victim out of their own account.
    """
    global _calls_since_purge

    now = time.monotonic()
    bucket = _hits[key]

    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()

    _calls_since_purge += 1
    if _calls_since_purge >= _PURGE_EVERY:
        _calls_since_purge = 0
        _purge(now, window_seconds)

    if len(bucket) >= limit:
        retry_after = int(window_seconds - (now - bucket[0])) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)
