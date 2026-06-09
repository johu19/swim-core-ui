# swim-core-ui

Frontend UI for the Swim Core project.

This app is being built as a mobile-first React application with desktop support. The current stack uses Vite, React, TypeScript, Tailwind CSS v4, and shadcn/ui-style components stored directly in the repo.

## Current Status

The project is currently in early setup. The app renders a simple placeholder screen while the authentication flow and core product screens are being built.

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

### Start the app

```bash
npm run dev
```

The local dev server runs on:

- [http://localhost:8000](http://localhost:8000)

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
- shadcn/ui configuration is stored in `components.json`.

## Next Focus

- Cognito authentication setup
- Google sign-in support
- Mobile-first auth screens
- Core Swim UI foundations
