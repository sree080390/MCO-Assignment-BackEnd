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
        └── package-lock.json 
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

7. **Tested it** by opening http://localhost:3000