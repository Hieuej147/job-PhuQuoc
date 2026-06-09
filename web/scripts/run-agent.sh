#!/bin/bash
cd "$(dirname "$0")/../agent" || exit 1
source ../.env 2>/dev/null
exec .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8125
