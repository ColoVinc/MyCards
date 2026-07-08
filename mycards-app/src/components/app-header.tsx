import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { LogOut, Plus, User } from 'lucide-react'
import { Logo } from '#/components/logo'
import { GlobalSearch } from '#/components/global-search'
import { Button } from '#/components/ui/button'
import { authClient } from '#/lib/auth-client'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'La mia collezione', game: null },
  { to: '/browse/$game', label: 'Pokémon', game: 'pokemon' },
  { to: '/browse/$game', label: 'One Piece', game: 'onepiece' },
  { to: '/browse/$game', label: 'Calciatori Panini', game: 'panini' },
] as const

export function AppHeader({ user }: { user: { name: string; email: string } }) {
  const navigate = useNavigate()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  async function handleLogout() {
    await authClient.signOut()
    await router.invalidate()
    navigate({ to: '/login' })
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Logo />

        <GlobalSearch />

        <Link
          to="/browse/$game"
          params={{ game: 'pokemon' }}
          className="hidden sm:block"
        >
          <Button size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Aggiungi carta
          </Button>
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu utente"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-bright focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <User className="h-5 w-5" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="glass absolute right-0 mt-2 w-60 rounded-md border border-border/60 p-2 shadow-xl"
            >
              <div className="border-b border-border/60 px-3 pt-1 pb-3">
                <p className="truncate text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <button
                role="menuitem"
                onClick={handleLogout}
                className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Esci
              </button>
            </div>
          )}
        </div>
      </div>

      <nav
        aria-label="Collezioni"
        className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6"
      >
        {NAV_ITEMS.map((item) =>
          item.game ? (
            <Link
              key={item.label}
              to={item.to}
              params={{ game: item.game }}
              activeProps={{ className: 'bg-primary/10 text-primary' }}
              inactiveProps={{
                className: 'text-muted-foreground hover:text-foreground',
              }}
              className="label-caps shrink-0 rounded-xl px-3 py-2 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <Link
              key={item.label}
              to={item.to}
              activeProps={{ className: 'bg-primary/10 text-primary' }}
              inactiveProps={{
                className: 'text-muted-foreground hover:text-foreground',
              }}
              className="label-caps shrink-0 rounded-xl px-3 py-2 transition-colors"
            >
              {item.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  )
}
