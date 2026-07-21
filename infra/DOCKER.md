# Running AssessOS with Docker

The full local stack (Postgres + Redis + Mongo + API + Web) is defined in
[`infra/docker-compose.yml`](./docker-compose.yml). Images build from
[`infra/docker/Dockerfile.api`](./docker/Dockerfile.api) and
[`Dockerfile.web`](./docker/Dockerfile.web).

```bash
# from the repo root
docker compose -f infra/docker-compose.yml up -d --build
# web  -> http://localhost:3001
# api  -> http://localhost:3000   (root is auth-guarded; returns 401 when healthy)
docker compose -f infra/docker-compose.yml logs -f api
docker compose -f infra/docker-compose.yml down -v   # stop + wipe volumes
```

The API container runs `prisma migrate deploy` on start, so a fresh database
is provisioned automatically (no manual migration step).

## ⚠️ Docker Desktop is broken on at least one Windows dev box — use the WSL engine

On some Windows hosts Docker Desktop fails to start: its host-side **Model
Runner / Inference** and **Secrets Engine** services try to bind AF_UNIX
sockets at Windows `C:\…` paths and the OS rejects them:

```
initializing Secrets Engine: listening on unix://C:/Users/.../engine.sock:
remove …: The file cannot be accessed by the system.
(listener: The filename, directory name, or volume label syntax is incorrect.)
```

This is a Docker Desktop bug, not a project issue, and it survives a clean
reinstall + config reset. Workaround: **run the Docker engine natively inside
WSL2** and ignore Docker Desktop.

```bash
# one-time: install the engine inside the WSL distro (run as root)
wsl -u root -e bash -lc 'apt-get update && apt-get install -y docker.io docker-compose-v2'

# start the daemon (root); keep it running in the background
wsl -u root -e bash -lc 'nohup dockerd >/var/log/dockerd.log 2>&1 &'

# build + run from the repo (Windows F: drive is mounted at /mnt/f)
wsl -u root -e bash -lc 'cd /mnt/f/Dev/assessos && docker compose -f infra/docker-compose.yml up -d --build'
```

Published ports (3001/3000/5432/6379/27017) are reachable on `localhost` from
inside the WSL shell. Verified: both images build, Postgres/Redis/Mongo report
healthy, the API applies its migration and listens on :3000, and the web app
serves `/login` (200).
