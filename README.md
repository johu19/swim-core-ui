# swim-core-ui

Frontend UI for the Swim Core project.

This app is being built as a mobile-first React application with desktop support. The current stack uses Vite, React, TypeScript, Tailwind CSS v4, and shadcn/ui-style components stored directly in the repo.

## Current Status

The project is in early setup with Cognito authentication working locally. After sign-in, the app loads a simple authenticated home screen with `Profile` and `Performances` tabs. The `Profile` tab calls the Swim Core backend and renders the `GET /me/profile` response.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui

## Local Development

### Requirements

- Node.js 24
- npm

### Install dependencies

```bash
npm install
```

Copy the auth environment template before starting the app:

```bash
cp .env.example .env
```

Then update the Cognito values in `.env` for your user pool and app client.
Also set `VITE_API_BASE_URL` to the Swim Core backend you want the UI to call.

### Start the app

```bash
npm run dev
```

The local dev server runs on:

- [http://localhost:3000](http://localhost:3000)

### Other commands

```bash
npm run build
npm run lint
npm run preview
```

## Project Notes

- The app is configured with the `@/*` import alias mapped to `src/*`.
- Reusable UI components live under `src/components/ui`.
- Shared utilities live under `src/lib`.
- Feature code lives under `src/features`.
- shadcn/ui configuration is stored in `components.json`.
- Cognito configuration is read from Vite environment variables.
- API requests use `VITE_API_BASE_URL`.
- The UI currently sends the Cognito `id_token` to the backend because the backend needs the email claim.

## Cognito Local URLs

When configuring the Cognito app client for local development, use:

- Callback URL: `http://localhost:3000/auth/callback`
- Logout URL: `http://localhost:3000/`

## Current Authenticated API Check

After a successful local sign-in:

- the UI calls `GET /me/profile`
- the request is sent to `VITE_API_BASE_URL`
- the response is still logged in the browser console
- the `Profile` tab renders the response in a simple way
- the `Performances` tab is currently a placeholder that says `Under development`
