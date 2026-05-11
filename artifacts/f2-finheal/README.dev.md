Developer setup (frontend)

Steps to run locally (Codespaces / local machine):

1. Copy the template:

   cp .env.example .env

2. Edit `.env` if you need a different backend host (default is `http://localhost:8000/api/v1`).

3. Start the dev server (ensure `PORT` and `BASE_PATH` are set in `.env` or environment):

   # Example (bash)
   export PORT=5173
   export BASE_PATH=/
   pnpm --filter @workspace/f2-finheal dev

Notes:
- Use `VITE_API_BASE_URL` to override the API endpoint.
- If your Codespace exposes ports differently, set `VITE_API_BASE_URL` to the backend URL visible to the Codespace browser.
- Do NOT commit your `.env` file. Use `.env.example` as source-of-truth.
