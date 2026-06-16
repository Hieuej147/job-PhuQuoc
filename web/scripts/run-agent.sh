#!/bin/bash
cd "$(dirname "$0")/../agent" || exit 1
set -a
[ -f ../.env ] && source ../.env
set +a
exec .venv/bin/uvicorn main:app --host 0.0.0.0 --port 8125
