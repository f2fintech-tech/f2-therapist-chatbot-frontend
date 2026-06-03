Developer setup (frontend)

Steps to run locally (Codespaces / local machine):

1. Copy the template:

   cp .env.example .env

2. Edit `.env` only if you need a different backend host; the default is `/api/v1`, which Vite proxies to the backend.

3. Start the dev server:

   pnpm dev

Notes:
- Use `VITE_API_BASE_URL` to override the API endpoint.
- The recommended local/Codespaces value is `/api/v1` so the browser talks only to the frontend origin.
- Do NOT commit your `.env` file. Use `.env.example` as source-of-truth.
