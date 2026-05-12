#!/usr/bin/env bash
# DigitalOcean CI/CD from the repo root (same flow as
# api-speed-survivor/deploy.sh and mobile-speed-survivor/deploy.sh).
#
# Builds the production Docker image and pushes :<short-sha> + :latest
# to the DO container registry configured in infra/digitalocean/env.sh.
# App Platform autodeploy handles the rollout.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ -z "${DIGITALOCEAN_ACCESS_TOKEN:-}" ]]; then
	echo "DIGITALOCEAN_ACCESS_TOKEN is not set. Example:"
	echo "  DIGITALOCEAN_ACCESS_TOKEN=... ./deploy.sh"
	exit 1
fi

# shellcheck source=infra/digitalocean/env.sh
source "$ROOT/infra/digitalocean/env.sh"

command -v doctl >/dev/null || {
	echo "doctl is not installed (https://docs.digitalocean.com/reference/doctl/how-to/install/)"
	exit 1
}
command -v docker >/dev/null || {
	echo "docker is not installed"
	exit 1
}

echo ''
echo '------------------------------------------------'
echo ''

doctl auth init --access-token "$DIGITALOCEAN_ACCESS_TOKEN"
doctl registry login --never-expire

echo 'Starting registry push...'

bash "$ROOT/infra/digitalocean/build-push.sh"

echo ''
echo 'Image push completed (App Platform autodeploy handles rollout).'
echo '------------------------------------------------'
echo ''
