# MyCards

Web application per catalogare, gestire e monitorare il valore della propria
collezione di carte **One Piece Card Game**, con visualizzazione 3D delle carte
ed effetti olografici per le rarità foil.

> L'app è nata come multi-gioco (Pokémon, Panini): al momento è concentrata solo
> su One Piece; la struttura resta pronta a riaggiungere altri giochi in futuro.

Le carte non si fotografano a mano: si **sfogliano le collezioni ufficiali**
(espansioni e carte importate da database online) e si aggiungono con un clic.

## Funzionalità principali

- **Autenticazione** email + password con sessioni persistenti e rotte protette.
- **Archivio catalogo**: espansioni → carte del set, con ricerca e paginazione
  (20 per pagina). Dati importati da API esterne e salvati in DB.
- **Ricerca globale** nell'header: digitando nome o codice compare un pannello di
  risultati su tutto il catalogo; un clic apre la carta.
- **Dettaglio carta** con **viewer 3D** (React Three Fiber): rotazione 360°,
  zoom, retro generato per le carte da catalogo, shader olografico per le foil.
- **Collezione personale** senza doppioni: ogni carta è una riga con un
  **contatore di copie** (stepper − / +). La dashboard mostra un badge ×N.
- **Valore di mercato**: prezzo per carta e **valore totale della collezione**,
  da OPTCG (USD, convertito in EUR con cambio BCE). Aggiornamento giornaliero
  (non è realtime: i prezzi di mercato cambiano ~una volta al giorno).

## Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19 + TypeScript strict, full-stack SSR)
- **Routing / Data / Form**: TanStack Router, TanStack Query, TanStack Form
- **Database**: PostgreSQL ([Neon](https://neon.com)) con [Drizzle ORM](https://orm.drizzle.team)
- **Autenticazione**: [Better Auth](https://better-auth.com) (email + password, sessioni cookie, rate limiting)
- **3D**: [React Three Fiber](https://r3f.docs.pmnd.rs) + drei, shader olografico custom
- **UI**: Tailwind CSS 4, design system "MyCards" (Sora / Hanken Grotesk / Space Grotesk)

## Fonti dati esterne (nessuna API key)

| Ambito                       | Fonte                                            |
| ---------------------------- | ------------------------------------------------ |
| Carte + espansioni One Piece | [OPTCG API](https://optcgapi.com)                |
| Prezzi                       | OPTCG / TCGplayer (USD)                          |
| Cambio valuta                | [Frankfurter](https://www.frankfurter.app) (BCE) |

Le immagini del catalogo sono cross-origin: per usarle come texture WebGL sono
servite tramite il proxy interno `/api/image-proxy`. Vengono importate solo le
carte con immagine.

## Avvio in sviluppo

```bash
npm install --legacy-peer-deps
npm run dev
```

Al primo avvio **Neon Launchpad provisiona automaticamente un database di
sviluppo** e scrive `DATABASE_URL` in `.env`; lo schema viene creato da
`db/init.sql`. Non serve alcun account.

L'app gira su [http://localhost:3000](http://localhost:3000).

> Nota: `--legacy-peer-deps` serve perché una dipendenza dichiara un peer di Vite
> più vecchio di quello usato dal progetto.

## Variabili d'ambiente

Vedi `.env.example` (i file `.env` e `.env.local` sono ignorati da git):

| Variabile            | Sviluppo                  | Produzione                       |
| -------------------- | ------------------------- | -------------------------------- |
| `DATABASE_URL`       | auto (Neon Launchpad)     | connection string Neon           |
| `BETTER_AUTH_URL`    | `http://localhost:3000`   | URL pubblico dell'app            |
| `BETTER_AUTH_SECRET` | qualsiasi stringa robusta | `npx -y @better-auth/cli secret` |

## Database e catalogo

Lo schema vive in `src/db/schema.ts` (Drizzle). Comandi utili:

```bash
npm run db:generate   # genera le migrazioni SQL in drizzle/
npm run db:migrate    # applica le migrazioni
npm run db:push       # push diretto dello schema (solo sviluppo)
npm run db:studio     # UI di ispezione del database

node scripts/apply-schema.mjs    # applica db/init.sql + ALTER additivi
npx tsx scripts/sync-catalog.ts  # importa TUTTO il catalogo (set + carte)
node scripts/set-logos.mjs       # assegna i loghi locali (public/loghi-collezioni/) ai set
```

Il catalogo si popola in modo **pigro** (un set viene importato quando lo si apre)
e si aggiorna da solo con un TTL di 7 giorni. Lo script `sync-catalog.ts`
scarica in anticipo tutte le espansioni e carte (utile per la ricerca globale).

I loghi delle espansioni non sono forniti da OPTCG: sono stati recuperati a mano
e vivono in `public/loghi-collezioni/`. `set-logos.mjs` è idempotente e non
viene mai sovrascritto dalla sync automatica (che tocca solo i set nuovi):
rilancialo se aggiungi un file o ricrei il DB. Manca ancora il logo di EB-01.

## Struttura del progetto

```
src/
├── routes/            # file-based routing (landing, auth, dashboard, browse, catalog)
├── components/        # componenti condivisi + ui/ (design system, ricerca globale)
├── features/
│   ├── auth/          # sessione, layout auth, server functions
│   ├── cards/         # collezione personale: server fn, query, viewer 3D, tile
│   ├── catalog/       # archivio: sync (server-only), query, server fn, stepper
│   └── pricing/       # componente valore di mercato
├── lib/               # auth (Better Auth), utils, formattazione valuta
├── db/                # schema Drizzle + client
└── services/          # sorgenti catalogo, prezzi, cambio valuta, storage
```

> I moduli con logica server-only (accesso al DB fuori dagli handler) usano il
> suffisso `.server.ts` e non vanno importati da codice client.

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
