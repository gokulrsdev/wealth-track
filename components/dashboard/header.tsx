"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { CircleHelp, LogOut, Menu, Settings } from "lucide-react"
import type { PageType } from "@/components/main-app"
import { getInitials, type UserProfile } from "@/lib/finance"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  currentPage: PageType
  onNavigate: (page: PageType) => void
  onMenuClick?: () => void
}

const pageLabels: Record<PageType, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  add: "Add Transaction",
  budgets: "Budgets",
  analytics: "Analytics",
  goals: "Goals",
  reports: "Reports",
  creators: "Creators",
  settings: "Settings",
  help: "Help",
}

export function Header({ currentPage, onNavigate, onMenuClick }: HeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      try {
        const response = await fetch("/api/users/profile", {
          cache: "no-store",
          credentials: "include",
        })

        if (!response.ok) {
          if (isMounted) {
            setProfile(null)
          }
          return
        }

        const data = await response.json()
        if (isMounted) {
          setProfile(data)
        }
      } catch {
        if (isMounted) {
          setProfile(null)
        }
      }
    }

    loadProfile()

    const handleFocus = () => {
      loadProfile()
    }

    const handleProfileUpdated = () => {
      loadProfile()
    }

    window.addEventListener("focus", handleFocus)
    window.addEventListener("wealth-track:profile-updated", handleProfileUpdated)

    return () => {
      isMounted = false
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("wealth-track:profile-updated", handleProfileUpdated)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg hover:bg-secondary transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{pageLabels[currentPage]}</h1>
          <p className="text-sm text-muted-foreground">
            {profile?.name ? `Welcome back, ${profile.name}` : "Manage your finances with your own data"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mounted ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-primary text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
                >
                  {getInitials(profile?.name)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{profile?.name || "Your profile"}</p>
                    <p className="text-xs font-normal text-muted-foreground">{profile?.email || "Signed in user"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onNavigate("settings")}>
                  <Settings className="h-4 w-4" />
                  Open Settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onNavigate("help")}>
                  <CircleHelp className="h-4 w-4" />
                  Help Center
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/60 to-primary text-sm font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              {getInitials(profile?.name)}
            </button>
          </>
        )}
      </div>
    </header>
  )
}
