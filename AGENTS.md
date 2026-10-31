# AGENTS.md — Fiche

Ce fichier est lu par l'agent avant toute action.

## Règles absolues
- Ne jamais inventer une API ou une prop React. Vérifier dans la documentation locale (`node_modules/next/dist/docs/`) ou demander.
- Suivre les instructions à la lettre. Aucune initiative créative.
- Si une information manque, s'arrêter et demander.

## Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS
- Supabase (Auth + PostgreSQL + RLS)
- Gemini API (structured output)
- Resend (emails)
- Vercel (déploiement + cron)
