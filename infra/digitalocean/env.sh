#!/usr/bin/env bash
# DigitalOcean Container Registry targets for web-speed-survivor.
# Tracked in git on purpose — these are not secrets, just deploy config.
# Set DIGITALOCEAN_ACCESS_TOKEN in the environment (never commit the token).
#
# Flow: ./deploy.sh → registry login → docker build → push (:sha + :latest).
# App Platform autodeploy then pulls from the registry on the watched tag.

# Full registry prefix: registry.digitalocean.com/<namespace> (no trailing slash)
export DOCKER_REGISTRY="registry.digitalocean.com/edgesports"

# Image repository name inside that registry. Sibling of `speed-survivor-api`
# in the same namespace so DO billing / RBAC stays unified.
export DOCKER_IMAGE_NAME="speed-survivor-web"
