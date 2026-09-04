"""MongoDB client for the Metric API.

Motor connects lazily, so constructing the client here at import time is safe:
it binds to whichever event loop first awaits an operation. What matters is that
the client is constructed *once*, with explicit timeouts — the driver defaults
(30s server selection) turn an unreachable database into a request that hangs
for half a minute before failing.
"""

import os

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    # Falling back to localhost here would be worse than crashing: a deployed
    # container would boot green, then hang for 30s on every request while it
    # dials a database that was never there. Fail where the cause is obvious.
    raise RuntimeError(
        "MONGO_URI is not set. The server has no database to talk to.\n"
        "Add it to backend/.env (see .env.example), or set it in your "
        "deployment's environment variables:\n"
        "  MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/metric_app\n"
        "Percent-encode reserved characters in the password (@ becomes %40)."
    )

# tlsCAFile is accepted (and simply unused) on a plain mongodb:// URI, so it can
# be passed unconditionally. Against Atlas it avoids depending on the OS trust
# store, which is the usual source of CERTIFICATE_VERIFY_FAILED on Windows.
client = AsyncIOMotorClient(
    MONGO_URI,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
    retryWrites=True,
    retryReads=True,
    appname="metric-api",
)

# The argument is the fallback used only when the URI carries no database in its
# path. A correctly formed URI (".../metric_db") resolves to metric_db.
db = client.get_default_database("metric_app")


def close() -> None:
    """Release the connection pool. Called from the FastAPI lifespan shutdown."""
    client.close()
