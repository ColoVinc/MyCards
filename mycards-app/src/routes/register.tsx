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

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    if (await getSessionFn()) throw redirect({ to: '/dashboard' })
  },
  component: RegisterPage,
})

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Inserisci il tuo nome (minimo 2 caratteri)'),
    email: z.email('Inserisci un indirizzo email valido'),
    password: z.string().min(8, 'La password deve avere almeno 8 caratteri'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  })

function RegisterPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    validators: { onSubmit: registerSchema },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const { error } = await authClient.signUp.email({
        name: value.name.trim(),
        email: value.email,
        password: value.password,
      })
      if (error) {
        setServerError(
          error.message === 'User already exists'
            ? 'Esiste già un account con questa email'
            : (error.message ?? 'Registrazione non riuscita, riprova'),
        )
        return
      }
      navigate({ to: '/dashboard' })
    },
  })

  return (
    <AuthLayout
      title="Crea il tuo account"
      subtitle="Inizia a catalogare la tua collezione in pochi secondi"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-5"
        noValidate
      >
        <form.Field name="name">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Nome</Label>
              <Input
                id={field.name}
                name={field.name}
                autoComplete="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError message={field.state.meta.errors[0]?.message} />
            </div>
          )}
        </form.Field>

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
                autoComplete="new-password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError message={field.state.meta.errors[0]?.message} />
            </div>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <div>
              <Label htmlFor={field.name}>Conferma password</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                autoComplete="new-password"
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
              {isSubmitting ? 'Creazione account…' : 'Registrati'}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Hai già un account?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Accedi
        </Link>
      </p>
    </AuthLayout>
  )
}
