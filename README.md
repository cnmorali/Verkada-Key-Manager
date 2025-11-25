# Verkada Key Manager

A small full-stack project that connects a Verkada AX11 to a custom 3d printed keybox. Keys are tracked using AUX inputs, and all events (take/return) are logged in Supabase along with the user who badged and a camera snapshot.

## Components

- A React + Vite frontend (the dashboard)
- A Supabase Edge Function (`ax11-webhook`) that processes AX11 webhooks
- Database tables for event logs, ongoing events, and key states

## Running the Frontend

```bash
npm install
npm run dev
```
The dashboard will open at the URL printed in your terminal.

## Backend (Supabase Edge Function)

The backend logic lives in:
```
supabase/functions/ax11-webhook/index.ts
```

## Environment Variables

Frontend uses:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Backend secrets are managed in Supabase:
```
PROJECT_URL
SERVICE_ROLE_KEY
VERKADA_API_KEY
VERKADA_SHARED_SECRET
ACCESS_CONTROLLER_ID
CAMERA_ID
KEYMAP
```

## Notes

Do not commit .env files - they are already ignored.

AX11 device IDs and the key mapping are stored in Supabase secrets.

The project requires a live AX11, reader, camera, and Verkada org to generate real events.


