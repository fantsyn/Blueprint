# Blueprint

**Your body as architecture.** A precision fitness web app that maps real metrics, physique photos, and goals into a personalised focus map, training, nutrition, and AI coach logging.

Design: quiet confidence — Linear / Arc / Levels Health. Dark by default. Soft glass, muted steel + soft cyan only for interactive elements.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Framer Motion
- Zustand (local profile / journal)
- xAI (SpaceXAI) for coach + optional physique vision

## Local development

```bash
npm install
cp .env.example .env.local
# add XAI_API_KEY=... to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Where |
|----------|----------|--------|
| `XAI_API_KEY` | For AI coach / vision | Vercel → Project → Settings → Environment Variables |

Never commit `.env.local`.

## Deploy to Vercel

1. Push this repo to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework: **Next.js** (auto-detected).
4. Add env var: `XAI_API_KEY` = your key (Production + Preview).
5. Deploy.

Or CLI:

```bash
npx vercel
npx vercel --prod
```

## GitHub (first push)

```bash
# if you use GitHub CLI
gh repo create blueprint --private --source=. --remote=origin --push

# or manually:
# create empty repo on github.com, then:
git remote add origin https://github.com/YOUR_USER/blueprint.git
git branch -M main
git push -u origin main
```

## App routes

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/login` · `/register` | Local account + remember me |
| `/onboarding` | Metrics → photos → goal → generate |
| `/today` | Priority, hologram, session, nutrition |
| `/coach` | AI + manual logging |
| `/workouts` | Calendar history |
| `/blueprint` | Full body map |
| `/nutrition` | Phase macros |
| `/progress` | Trends + insights |
| `/update` | Physique update → hologram refresh |

## License

Private / personal use unless you state otherwise.
