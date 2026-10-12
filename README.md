# LeadsZone AI Calling — landing page

Standalone Next.js (App Router) site for the LeadsZone AI Calling feature. The page lives at `/`.

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

Configure links and the production domain with the variables in `.env.example`.

## Structure

- `src/app/` – layout, page, metadata, robots, sitemap, share image (`/og-image`)
- `src/components/ai-calling/` – page sections, the robot mascot and the hero call simulation
  (`hero-timeline.ts` is the single animation clock; `hero-demo.tsx` renders it)
- `src/components/layout/` – header and footer
- `src/data/ai-calling.ts` – all copy and illustrative sample data

To verify a production build without disturbing a running `next dev`, build into a separate folder:
`NEXT_DIST_DIR=.next-verify npm run build`.
