# swim-core-ui

Frontend UI for the Swim Core project.

This app is being built as a mobile-first React application with desktop support. The current stack uses Vite, React, TypeScript, Tailwind CSS v4, and shadcn/ui-style components stored directly in the repo.

## Current Status

The project has Cognito authentication working locally and now includes three authenticated product areas:

- `Profile`
- `Performances`
- `Charts`

The UI can load profile and performance data from the Swim Core backend, manage performances, and visualize filtered performance trends and split comparisons.

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
npm run typecheck
npm run build
npm run ci
npm run lint
npm run preview
npm run test
npm run test:watch
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
- Component tests use `Vitest` and `Testing Library`.
- A first GitHub Actions CI workflow lives in `.github/workflows/ci.yml`.

## Cognito Local URLs

When configuring the Cognito app client for local development, use:

- Callback URL: `http://localhost:3000/auth/callback`
- Logout URL: `http://localhost:3000/`

## Current App Capabilities

After a successful local sign-in:

- the UI calls `GET /me/profile`
- the UI calls `GET /performances`
- requests are sent to `VITE_API_BASE_URL`
- the `Profile` tab supports viewing and editing profile information
- the `Performances` tab supports filtering, creating, editing, deleting, and viewing splits
- the `Charts` tab supports filtered trend views, selected-performance details, split charts, and comparison mode for compatible performances

## Testing

The repo includes simple unit coverage for:

- `Profile`
- `Performances`
- `PerformanceDialog`

Run the suite with:

```bash
npm run test
```

## CI/CD

GitHub Actions now handles continuous integration plus development deployment for this repo.

### CI

The CI workflow runs on pull requests and on pushes to `master`.

It executes:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

When CI succeeds, it also uploads the production `dist` folder as a workflow artifact.

### Development Deployment

When a pull request is merged into `master`, GitHub Actions deploys the app to the development AWS environment after CI passes.

The deployment flow:

- installs dependencies with Node.js 24
- rebuilds the app with development Vite environment values
- uploads the development `dist` folder as a workflow artifact
- assumes an AWS role through GitHub OIDC
- syncs the built app to an S3 bucket
- optionally invalidates a CloudFront distribution

### GitHub Environment Setup

Create a GitHub environment named `development`.

Set these environment variables in that environment:

- `AWS_REGION`
- `AWS_S3_BUCKET_DEV`
- `AWS_CLOUDFRONT_DISTRIBUTION_ID_DEV` (optional)
- `VITE_API_BASE_URL`
- `VITE_COGNITO_AUTHORITY`
- `VITE_COGNITO_CLIENT_ID`
- `VITE_COGNITO_DOMAIN`
- `VITE_COGNITO_LOGOUT_URI`
- `VITE_COGNITO_REDIRECT_URI`
- `VITE_COGNITO_SCOPE`

Set this environment secret:

- `AWS_ROLE_TO_ASSUME`

### AWS Deployment Assumption

The current CD setup assumes the development frontend is hosted as a static site in `S3`, optionally fronted by `CloudFront`.
If your AWS hosting approach changes later, we can adapt the deploy job without changing the CI gate.
