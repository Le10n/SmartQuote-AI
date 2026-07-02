# SmartQuote AI

A production-ready SaaS dashboard for AI-assisted quote operations, built with React 19, TypeScript, Vite, Tailwind CSS v4, shadcn-style UI primitives, React Router, Framer Motion, Recharts, React Hook Form, Zod, Supabase, PDF generation, and OpenAI-powered quote assistance.

## Run locally

```bash
npm install
npm run dev
```

## Required environment

Create `.env.local` from `.env.example`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_URL=http://localhost:5173
```

## Supabase setup

1. Create a Supabase project.
2. Apply `supabase/migrations/202607010001_initial_saas_schema.sql`.
3. Enable email authentication in Supabase Auth.
4. Deploy edge functions:

```bash
supabase functions deploy ai-assistant
supabase functions deploy send-quote-email
```

5. Set edge function secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-your-openai-key
supabase secrets set OPENAI_MODEL=gpt-5
supabase secrets set RESEND_API_KEY=re_your_resend_key
supabase secrets set QUOTE_EMAIL_FROM="SmartQuote AI <quotes@yourdomain.com>"
```

## Build

```bash
npm run build
```

## Production features

- Supabase Auth with login, register, forgot password, email verification, and protected routes.
- Row-level-secured Supabase schema for clients, products, quotes, quote items, settings, activity, and storage.
- Complete CRUD for clients, products, and quotes with archive, restore, delete, search, filters, pagination, undo delete, empty states, and loading states.
- Real database dashboard and analytics with revenue, quote status, top clients, top products, recent records, activity, and charts.
- Professional quote builder with unlimited products, discounts, tax, automatic totals, draft/approve/reject/duplicate flows.
- PDF generation with company branding, QR code, terms, download, and direct email via Supabase Edge Function.
- OpenAI assistant via server-side Supabase Edge Function for descriptions, rewriting, pricing, notes, emails, product suggestions, and marketing text.
- Supabase Storage for company logos, product images, client files, and quote attachments.
- Global search, toast notifications, keyboard shortcuts, lazy-loaded routes, and responsive SaaS UX.

## Structure

```text
src/
  components/
  layouts/
  pages/
  hooks/
  lib/
  services/
  types/
  utils/
supabase/
  functions/
  migrations/
```
