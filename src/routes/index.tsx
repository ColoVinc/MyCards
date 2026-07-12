import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Box, Layers, Search, Sparkles } from 'lucide-react'
import { Logo } from '#/components/logo'
import { Button } from '#/components/ui/button'
import { getSessionFn } from '#/features/auth/server'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await getSessionFn()
    if (session) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})

const FEATURES = [
  {
    icon: Layers,
    title: 'Tutto in un posto',
    description:
      'Sfoglia le espansioni di One Piece Card Game e tieni la tua collezione completa, sempre con te.',
  },
  {
    icon: Box,
    title: 'Carte in 3D',
    description:
      'Ruota ogni carta a 360°, osserva fronte e retro e ammira gli effetti olografici delle carte rare.',
  },
  {
    icon: Search,
    title: 'Trova subito tutto',
    description:
      'Ricerca istantanea per nome o numero, filtri per collezione e rarità, ordinamenti flessibili.',
  },
] as const

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass sticky top-0 z-40 border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Accedi
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Registrati</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(700px 400px at 85% -10%, rgba(0, 85, 255, 0.12), transparent 60%), radial-gradient(500px 300px at 5% 20%, rgba(202, 169, 0, 0.1), transparent 60%)',
            }}
          />
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="rise-in mx-auto max-w-3xl text-center">
              <span className="label-caps inline-block rounded-xl bg-primary/10 px-3 py-2 text-primary">
                Collector Database
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
                La tua collezione di carte,{' '}
                <span className="text-primary">viva online</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                MyCards ti permette di catalogare le tue carte collezionabili,
                ritrovarle in un attimo e mostrarle come meritano: in 3D, con
                effetti olografici realistici.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                    Inizia la tua collezione
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button variant="ghost" size="lg" className="w-full">
                    Ho già un account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="card-lift rounded-lg border border-border/60 bg-card p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-lg font-bold">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MyCards — Cataloga. Colleziona. Ammira.
        </p>
      </footer>
    </div>
  )
}
