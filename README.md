# USDTB App

[![Backend CI](https://github.com/USDTB/usdtb/actions/workflows/backend.yml/badge.svg)](https://github.com/USDTB/usdtb/actions/workflows/backend.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-14151a?logo=bun&logoColor=fbf0df)](https://bun.sh/)
[![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Base](https://img.shields.io/badge/Base-0052FF?logo=coinbase&logoColor=white)](https://base.org/)

The community card app for $USDTB. Get non-KYC virtual Visa cards and 200+ gift cards by paying with USDC or $USDTB on Base.

## Structure

```
.                  # Next.js 15 frontend (app.usdtb.us)
└── backend/       # Bun + Express API (containerised)
```

## Development

**Frontend**
```bash
bun install
bun dev          # Turbopack
```

**Backend**
```bash
cd backend
bun install
bun dev
```

## Environment

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

See each `.env.example` for required values.

## Deployment

Backend ships as a Docker container pushed to GHCR and deployed on Render via `.github/workflows/backend.yml`.

