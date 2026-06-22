# DigitalOcean Container Registry

Same flow as `api-speed-survivor` and `mobile-speed-survivor`: edit
[`env.sh`](./env.sh) (tracked in git), then run `./deploy.sh` from the repo
root with `DIGITALOCEAN_ACCESS_TOKEN` set.

The pipeline **builds and pushes** the image (`:<git-sha>` and `:latest`).
**App Platform autodeploy** should watch one of those tags — there's no
`doctl apps create-deployment` call in this repo.

Scripts: [`env.sh`](./env.sh), [`build-push.sh`](./build-push.sh).
The Dockerfile lives at [`infra/docker/Dockerfile`](../docker/Dockerfile).

## Configuration ([`env.sh`](./env.sh))

| Variable | Meaning |
|----------|---------|
| `DOCKER_REGISTRY` | Full prefix `registry.digitalocean.com/<namespace>` (no trailing slash) |
| `DOCKER_IMAGE_NAME` | Image repository name inside that registry |

Currently set to `registry.digitalocean.com/edgesports/speed-survivor-web`.

## GitHub Actions

Repository secret: **`DIGITALOCEAN_ACCESS_TOKEN`** (Settings → Secrets and
variables → Actions → New repository secret). The
[`deploy-do.yml`](../../.github/workflows/deploy-do.yml) workflow sources
[`env.sh`](./env.sh) and runs [`build-push.sh`](./build-push.sh) on every
push to `main`.

## Local usage

```bash
export DIGITALOCEAN_ACCESS_TOKEN=...
./deploy.sh
```

Or, if you've already authenticated `doctl` once:

```bash
source infra/digitalocean/env.sh
bash infra/digitalocean/build-push.sh
```

Point App Platform at `${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest`
(or your chosen tag) and enable deploy on push.

## Container

HTTP port **8080**. The Next.js standalone server listens on
`PORT=8080` / `HOSTNAME=0.0.0.0` by default — App Platform will detect
this from the `EXPOSE` directive and route traffic accordingly.

Health check: `GET /api/health` → `200 OK` with `{"status":"ok",...}`.
Wire that path into App Platform's HTTP health check.

## Runtime env vars (DigitalOcean App Platform UI)

`NEXT_PUBLIC_*` values are baked into the JS bundle at `next build` time
from [`.env.production`](../../.env.production) (tracked in git on
purpose — these are inlined into the client and have no secret to
protect). `PAYMENTS_API_BASE_URL` is also tracked there as a non-secret,
server-only default for the hosted `api-payments` service. Server-only
secrets must be set as App Platform env vars on the `web-speed-survivor`
service:

| Variable | Purpose |
|---|---|
| `PAYMENTS_API_BASE_URL` | Base URL for `api-payments`, used by `/api/payments/*` route handlers. Defaults to `https://payments-api-zqlo6.ondigitalocean.app` in `.env.production`; override only if the hosted payments API URL changes. |
| `APP_JWT_SHARED_SECRET` | Optional. If set, route handlers can verify the api-speed-survivor JWT locally instead of calling `/api/v1/me`. Currently unused — leave blank. |

If you change anything in `.env.production`, you must rebuild and redeploy
(those values are baked at build time, not read at runtime).
