# Hello World: Backend API (Fastify)

The backend part of a small three-tier "Hello World" demo application. It is a
Node.js API built with Fastify that returns a "Hello World" message as JSON.

## Repository structure

```
<backend-repo>/
├── README.md
└── hello-world/
    ├── index.js          
    ├── package.json      
    ├── package-lock.json 
    ├── Dockerfile
    └── .dockerignore
```

## Where each capability can be found

| Capability | Location | What it does |
|---|---|---|
| Backend API (Fastify) | `hello-world/index.js` | Defines the routes `/api/hello`, `/api/db/hello`, `/api/message` (GET/PUT) and `/healthz` |
| Database (SQLite) | `hello-world/index.js` (steps 2–3 in the code) | Uses Node's built-in `node:sqlite`; creates the tables and seed rows on startup. The file path is set by `DB_PATH` |
| Dependencies | `hello-world/package.json`, `hello-world/package-lock.json` | Fastify, with exact pinned versions for repeatable installs |
| Container image (Podman) | `hello-world/Dockerfile` | Builds the API on `node:24-alpine` and stores the database at `/data/app.db` |
| Build exclusions | `hello-world/.dockerignore` | Keeps `node_modules`, `.git` and local `*.db` files out of the image |
| Data persistence | `podman run ... -v mco-data:/data` (see "Container test on Windows") | A named volume keeps the SQLite file across container restarts |
| Health check | `/healthz` route in `hello-world/index.js` | Used to check that the container is alive (and later by Kubernetes probes) |
| CI pipeline (GitHub Actions) | `.github/workflows/github-ci.yaml` | Builds the image and scans it with Trivy (ECR push prepared, not yet enabled) |
| Frontend | Separate repo: `MCO-Assignment-FrontEnd` | React app served by nginx, which proxies `/api/` to this API |

## Local backend test on Windows (without containers)

These are the steps I followed to create and test the Fastify API on my Windows machine.

### Prerequisites
- Node.js and npm installed
- Command Prompt

### Steps I followed

1. **Created the project folder**
   ```cmd
   mkdir hello-world
   ```

2. **Moved into the folder**
   ```cmd
   cd hello-world
   ```

3. **Initialised a Node.js project**
   ```cmd
   npm init -y
   ```
   This creates `package.json` with default values.

4. **Installed Fastify**
   ```cmd
   npm install fastify
   ```
   This adds Fastify to `package.json` and downloads it into `node_modules`.

5. **Created `index.js`** inside the `hello-world` folder

6. **Started the API**
   ```cmd
   node index.js
   ```

7. **Tested it** by opening these URLs in the browser
   - http://localhost:3000/api/hello : Hello World from the backend API
   - http://localhost:3000/api/db/hello : Hello World from the SQLite database
   - http://localhost:3000/healthz : health check, returns `{"status":"ok"}`

## Container test on Windows (Podman)

These are the steps I followed to run the same API as a container with Podman.

### Prerequisites
- Podman installed, with a Podman machine running (`podman machine start`)
- PowerShell

### Steps I followed

1. **Created the `Dockerfile`** inside the `hello-world` folder
   ```dockerfile
   FROM node:24-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN mkdir -p /data && chown node:node /data
   ENV DB_PATH=/data/app.db
   EXPOSE 3000
   CMD ["node", "index.js"]
   ```
   This installs the dependencies inside the image and stores the SQLite database at `/data/app.db`.

2. **Created the `.dockerignore`** inside the `hello-world` folder
   ```
   node_modules
   build
   .git
   Dockerfile
   .gitignore
   *.db
   ```
   This keeps the local `node_modules` and any local database file out of the image.

3. **Built the image**
   ```powershell
   podman build --network=host -t mco-backend:latest .
   ```
   `--network=host` works around a Podman-on-WSL networking error (`nftables error`) during `npm install`.

4. **Ran the container**
   ```powershell
   podman run -d --name mco-backend-container --network=host -v mco-data:/data localhost/mco-backend:latest
   ```
   `-v mco-data:/data` keeps the database on a named volume, so data survives when the container is removed.

5. **Checked that it started**
   ```powershell
   podman ps
   podman logs mco-backend-container
   ```
   The logs show `Server listening at http://0.0.0.0:3000`.

6. **Tested it** from inside the Podman machine
   ```powershell
   podman machine ssh curl -s http://localhost:3000/api/hello
   podman machine ssh curl -s http://localhost:3000/api/db/hello
   ```
   Both return a JSON "Hello World" message: one from the API, one from the SQLite database.

## CI pipeline (GitHub Actions)

The pipeline is defined in `.github/workflows/github-ci.yaml` and runs on every push to the `main` branch.

### How it works

| Step | What it does |
|---|---|
| Checkout code | Gets the repository code onto the GitHub runner |
| Build the image | Runs `podman build -t mco-backend:latest .` in the `hello-world` folder, using the same `Dockerfile` as local testing |
| Save image for scanning | Exports the image to `image.tar` with `podman save` |
| Set up Trivy | Scans `image.tar` for HIGH and CRITICAL vulnerabilities and fails the pipeline if a fixable one is found |
| Configure AWS credentials, Login to ECR, Push the image to ECR | Prepared but commented out (not yet enabled) |

### Notes

- **Runner:** `ubuntu-latest` is the virtual machine GitHub provides for the job. Podman is
  already installed on it, so the pipeline has no install step.
- **Why the image is saved to a tar file:** Trivy cannot read images directly from Podman's
  local storage on the runner (there is no Docker daemon or Podman socket). Scanning
  `image.tar` avoids that.
- **Trivy version:** the action is pinned to `aquasecurity/trivy-action@v0.35.0`. Most older
  version tags of this action were compromised in March 2026 (CVE-2026-33634), so a fixed,
  known-safe version is used instead of `@master`.
- **Scan gate:** `exit-code: "1"` with `severity: CRITICAL,HIGH` and `ignore-unfixed: true`
  means the pipeline fails only for serious vulnerabilities that already have a fix.

### Enabling the push to Amazon ECR (not yet enabled)

1. Replace `<account-id>` in `REGISTRY` with the real AWS account ID (or use a repository
   variable: `${{ vars.AWS_ACCOUNT_ID }}`).
2. Create an IAM role that GitHub can assume through OIDC, with permission to push to the
   `mco-backend` ECR repository.
3. Add `permissions: id-token: write` (and `contents: read`) to the job.
4. Uncomment the "Configure AWS credentials", "Login to ECR" and "Push the image to ECR" steps.
5. Tag the image with the full ECR name (`$REGISTRY/mco-backend`) in the build step so the pushed
   image matches the scanned one.