import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema.ts'

/**
 * Neon fornisce la connection string con `sslmode=require`, che le versioni
 * recenti di `pg` trattano come alias di `verify-full` emettendo un warning di
 * deprecazione ad ogni avvio. Lo rendiamo esplicito: stesso comportamento,
 * console pulita.
 */
function resolveConnectionString(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) return raw!
  try {
    const url = new URL(raw)
    if (url.searchParams.get('sslmode') === 'require') {
      url.searchParams.set('sslmode', 'verify-full')
    }
    return url.toString()
  } catch {
    return raw
  }
}

export const db = drizzle(resolveConnectionString(), { schema })
