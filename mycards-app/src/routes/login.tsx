import { useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { AuthLayout } from '#/features/auth/auth-layout'
import { getSessionFn } from '#/features/auth/server'
import { Button } from '#/components/ui/button'
import { FieldError, Input, Label } from '#/components/ui/input'
import { authClient } from '#/lib/auth-client'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional().catch(undefined),
  }),
  beforeLoad: async () => {
    if (await getSessionFn()) throw redirect({ to: '/dashboard' })
  },
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.email('Inserisci un indirizzo email valido'),
  password: z.string().min(1, 'Inserisci la password'),
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const { error } = await authClient.signIn.email({
        email: value.email,
        password: value.password,
      })
      if (error) {
        setServerError('Email o password non corretti')
        return
      }
      navigate({ to: search.redirect ?? '/dashboard' })
    },
  })

  return (
    <AuthLayout
      title="Bentornato"
      subtitle="Accedi per consultare la tua collezione"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-5"
        noValidate
      >
        <form.Field name="email">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                autoComplete="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError message={field.state.meta.errors[0]?.message} />
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="current-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError message={field.state.meta.errors[0]?.message} />
            </div>
          )}
        </form.Field>

        {serverError && (
          <p
            role="alert"
            className="rounded bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
          >
            {serverError}
          </p>
        )}

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Accesso…' : 'Accedi'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Non hai un account?{' '}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Registrati
        </Link>
      </p>
    </AuthLayout>
  )
}

// Test
