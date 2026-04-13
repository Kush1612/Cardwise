# Spendwise Vercel Deployment TODO

## Approved Plan Steps (In Progress)

### 1. Local Development Setup ✅

- [x] Create backend/.env with MONGODB_URI template
- [x] Update frontend/vite.config.js with proxy for local dev
- [x] Update frontend/src/api/client.js for dev proxy
- [x] Root package.json scripts exist
- [!] Install deps: `cd backend && npm i && cd ../frontend && npm i`
- [!] Test local: Get MongoDB Atlas URI → update backend/.env → `npm run dev:backend` & `npm run dev:frontend`

### 2. Backend Vercel Preparation ✅

- [x] Refactor backend/src/server.js for Vercel serverless (export app)
- [x] Create backend/api/index.js (Vercel entrypoint)
- [x] Create backend/vercel.json (build config)
- [x] Update backend/package.json (add vercel-build)

### 3. Deploy Backend to Vercel

- [ ] vercel --prod (in backend/) + set MONGODB_URI env var
- [ ] Get backend Vercel URL

### 4. Frontend Vercel Preparation

- [ ] Update frontend/src/api/client.js for prod API URL

### 5. Deploy Frontend to Vercel

- [ ] vercel --prod (in frontend/) + set VITE_API_URL=backend-url

### 6. Testing & Completion

- [ ] Test full deployed app
- [ ] Update README with deployment URLs
