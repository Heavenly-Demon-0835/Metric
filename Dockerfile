FROM python:3.12-slim

WORKDIR /app

# Copy only backend requirements first for layer caching
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Expose the port Railway provides via $PORT
EXPOSE 8000

# Start uvicorn – Railway injects $PORT at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
