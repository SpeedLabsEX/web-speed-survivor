#!/usr/bin/env bash
# Build the web-speed-survivor image and push to DigitalOcean Container
# Registry. Tags both `:<short-sha>` and `:latest`. App Platform autodeploy
# is expected to watch one of those tags.
#
# Reads DOCKER_REGISTRY and DOCKER_IMAGE_NAME from infra/digitalocean/env.sh
# (or from env already exported). Prerequisites: docker, authenticated
# registry (`doctl registry login`).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/env.sh" ]]; then
	# shellcheck source=env.sh
	source "$SCRIPT_DIR/env.sh"
fi

PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKERFILE="${DOCKERFILE:-$PROJECT_ROOT/infra/docker/Dockerfile}"

DOCKER_REGISTRY="${DOCKER_REGISTRY%/}"
DOCKER_REGISTRY="${DOCKER_REGISTRY:?Set DOCKER_REGISTRY in infra/digitalocean/env.sh}"
DOCKER_IMAGE_NAME="${DOCKER_IMAGE_NAME:?Set DOCKER_IMAGE_NAME in infra/digitalocean/env.sh}"

# Tag = first 12 of the GitHub SHA when running in CI; otherwise the local
# `git rev-parse --short HEAD`. Override with `TAG=...` to push a custom tag.
if [[ -n "${GITHUB_SHA:-}" ]]; then
	TAG="${TAG:-${GITHUB_SHA:0:12}}"
else
	TAG="${TAG:-$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)}"
fi

REMOTE_IMAGE="${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${TAG}"
LATEST_IMAGE="${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest"

echo "Building ${REMOTE_IMAGE}"
docker build \
	-f "$DOCKERFILE" \
	-t "$REMOTE_IMAGE" \
	"$PROJECT_ROOT"

echo "Pushing ${REMOTE_IMAGE}"
docker push "$REMOTE_IMAGE"

docker tag "$REMOTE_IMAGE" "$LATEST_IMAGE"
echo "Pushing ${LATEST_IMAGE}"
docker push "$LATEST_IMAGE"

echo "IMAGE_REF=${REMOTE_IMAGE}"
