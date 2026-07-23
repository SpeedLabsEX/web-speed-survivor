#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

if ! command -v node >/dev/null 2>&1; then
	echo "node is required." >&2
	exit 1
fi

if command -v yarn >/dev/null 2>&1; then
	yarn install --frozen-lockfile
else
	if command -v corepack >/dev/null 2>&1; then
		corepack enable
		yarn install --frozen-lockfile
	else
		echo "yarn (or corepack) is required." >&2
		exit 1
	fi
fi

if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
	cp ".env.local.example" ".env.local"
	echo "Created .env.local from .env.local.example (edit as needed)."
fi

echo "Bootstrap complete."
