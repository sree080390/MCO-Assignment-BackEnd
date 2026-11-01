# Hello World: Backend API (Fastify)

The backend part of a small three-tier "Hello World" demo application. It is a
Node.js API built with Fastify that returns a "Hello World" message as JSON.

## Repository structure

```
<backend-repo>/
├── README.md
└── hello-world/
    └── fastify-api/
        ├── index.js          
        ├── package.json      
        ├── package-lock.json 
        ├── Dockerfile
        └── .dockerignore
```

## Local backend test on Windows (without containers)

These are the steps I followed to create and test the Fastify API on my Windows machine.

### Prerequisites
- Node.js and npm installed
- Command Prompt

### Steps I followed

1. **Created the project folder**
   ```cmd
   mkdir fastify-api
   ```

2. **Moved into the folder**
   ```cmd
   cd fastify-api
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

5. **Created `index.js`** inside the `fastify-api` folder

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

1. **Created the `Dockerfile`** inside the `fastify-api` folder
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

2. **Created the `.dockerignore`** inside the `fastify-api` folder
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
   
6. **Tested it** from inside the Podman machine
   ```powershell
   podman machine ssh curl -s http://localhost:3000/api/hello
   podman machine ssh curl -s http://localhost:3000/api/db/hello
   ```
   Both return a JSON "Hello World" message: one from the API, one from the SQLite database.