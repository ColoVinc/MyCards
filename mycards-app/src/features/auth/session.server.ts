// Modulo server-only: importarlo esclusivamente dentro handler di server function.
import { getRequest } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth'

export async function getSession() {
  const request = getRequest()
  return auth.api.getSession({ headers: request.headers })
}

/** Restituisce l'id utente della sessione corrente o lancia 401. */
export async function requireUserId(): Promise<string> {
  const session = await getSession()
  if (!session) {
    throw new Response('Unauthorized', { status: 401 })
  }
  return session.user.id
}
