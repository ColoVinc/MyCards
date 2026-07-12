import { createServerFn } from '@tanstack/react-start'
import { getSession } from '#/features/auth/session.server'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await getSession()
    if (!session) return null
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    }
  },
)
