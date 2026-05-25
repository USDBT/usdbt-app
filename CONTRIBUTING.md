# Contributing to USDTB

## Getting Started

**Frontend**
```bash
bun install
bun dev
```

**Backend**
```bash
cd backend
bun install
bun dev
```

## Branch Naming

- `feat/description` — new features
- `fix/description` — bug fixes
- `chore/description` — maintenance

## Pull Requests

1. Fork the repo and create your branch from `main`
2. Ensure `bun run check` passes in both frontend and backend
3. Ensure `bun test` passes in the backend
4. Open a pull request against `main`

## Environment

Copy `.env.example` to `.env` in both the root and `backend/` directories and fill in your values before running locally.
