# Autonomous Solana Meme Coin Trading System

Production-grade, highly reliable, mobile-first autonomous Solana trading system.

## Vercel Deployment Instructions (CRITICAL)

When deploying to **Vercel**:
1. Select **Root Directory** as `apps/web`.
2. Do NOT leave Root Directory as repository root (`.`).
3. Set Environment Variable: `NEXT_PUBLIC_API_URL` to point to your deployed FastAPI backend URL.

## Persistent Worker Deployment

The trading backend and execution worker MUST run on a persistent long-running server (e.g., Render, Railway, DigitalOcean App Platform, AWS EC2, or Docker instance).
- Vercel is strictly for hosting the `apps/web` Next.js frontend dashboard.
- Do NOT run autonomous worker loops in Vercel Serverless Functions.

## Local Quick Start with Docker

```bash
cp .env.example .env
docker-compose up --build
