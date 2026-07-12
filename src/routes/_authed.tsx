import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionFn } from '#/features/auth/server'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const session = await getSessionFn()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { user: session.user }
  },
  component: Outlet,
})
