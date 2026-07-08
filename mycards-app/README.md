# MyCards

Web application per catalogare, gestire e visualizzare online la propria collezione di carte collezionabili (Pokémon, One Piece Card Game, Calciatori Panini), con visualizzazione 3D delle carte ed effetti olografici per le rarità foil.

Le carte si aggiungono **sfogliando le collezioni ufficiali** (espansioni e carte importate da database online) e cliccando "Aggiungi": niente foto fatte a mano.

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + TypeScript strict, full-stack)
- **Routing / Data / Form**: TanStack Router, TanStack Query, TanStack Form
- **Database**: PostgreSQL ([Neon](https://neon.com)) con [Drizzle ORM](https://orm.drizzle.team)
- **Autenticazione**: [Better Auth](https://better-auth.com) (email + password, sessioni cookie, rate limiting)
- **Catalogo carte**: [TCGdex](https://tcgdex.dev) (Pokémon, italiano) e [OPTCG API](https://optcgapi.com) (One Piece) — importati in DB con sync pigra
- **3D**: [React Three Fiber](https://r3f.docs.pmnd.rs) + drei, shader olografico custom, retro generato per le carte da catalogo
- **UI**: Tailwind CSS 4, design system "MyCards" (Sora / Hanken Grotesk / Space Grotesk)

## Avvio in sviluppo

```bash
npm install --legacy-peer-deps
npm run dev
```

Al primo avvio **Neon Launchpad provisiona automaticamente un database di sviluppo** e scrive `DATABASE_URL` in `.env.local`; lo schema viene creato da `db/init.sql`. Non serve alcun account.

L'app gira su [http://localhost:3000](http://localhost:3000).

### Archivio collezioni

Dal menu si accede all'archivio di ogni gioco: si sfogliano le espansioni, si aprono le carte di un set (ricerca per nome/numero) e si aggiungono alla propria collezione. Le carte e le espansioni vengono importate dalle API esterne al primo accesso e salvate in DB (`catalog_sets`, `catalog_cards`). Le immagini, cross-origin, sono servite come texture 3D tramite il proxy interno `/api/image-proxy`. Calciatori Panini è al momento in standby (nessuna fonte dati aperta).

## Variabili d'ambiente

Vedi `.env.example`:

| Variabile               | Sviluppo                  | Produzione                       |
| ----------------------- | ------------------------- | -------------------------------- |
| `DATABASE_URL`          | auto (Neon Launchpad)     | connection string Neon           |
| `BETTER_AUTH_URL`       | `http://localhost:3000`   | URL pubblico dell'app            |
| `BETTER_AUTH_SECRET`    | qualsiasi stringa robusta | `npx -y @better-auth/cli secret` |

## Database

Lo schema vive in `src/db/schema.ts` (Drizzle). Comandi utili:

```bash
npm run db:generate   # genera le migrazioni SQL in drizzle/
npm run db:migrate    # applica le migrazioni
npm run db:push       # push diretto dello schema (solo sviluppo)
npm run db:studio     # UI di ispezione del database
```

## Struttura del progetto

```
src/
├── routes/            # file-based routing (landing, auth, dashboard, carte)
├── components/        # componenti riutilizzabili + ui/ (design system)
├── features/
│   ├── auth/          # sessione, layout auth, server functions
│   ├── cards/         # collezione personale: server functions, query, viewer 3D
│   └── catalog/       # archivio collezioni: sync, query, server functions
├── lib/               # auth (Better Auth), utils
├── db/                # schema Drizzle + client
└── services/          # sorgenti catalogo esterne + util storage
```

## Build e deploy (Vercel)

```bash
npm run build
```

1. Crea un progetto Vercel e collega il repository (framework: TanStack Start / Vite).
2. Crea un database [Neon](https://neon.com) e imposta `DATABASE_URL`.
3. Applica lo schema: `npm run db:push` (o `db:migrate`).
4. Imposta `BETTER_AUTH_URL` (URL pubblico) e `BETTER_AUTH_SECRET`.

## Test e qualità

```bash
npm run test     # vitest
npm run lint     # eslint
npm run check    # prettier --check
```
