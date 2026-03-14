"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { Check, Globe, Loader2, LogOut, Moon, Save, Sun, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getInitials, type UserProfile } from "@/lib/finance"
import { useAppPreferences } from "@/components/providers/app-preferences-provider"
import { cn } from "@/lib/utils"

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "EUR", name: "Euro" },
  { code: "GBP", symbol: "GBP", name: "British Pound" },
  { code: "INR", symbol: "INR", name: "Indian Rupee" },
  { code: "JPY", symbol: "JPY", name: "Japanese Yen" },
] as const

export function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const {
    selectedCurrency,
    setSelectedCurrency,
    formatCurrency,
  } = useAppPreferences()

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setLoading(true)

      try {
        const response = await fetch("/api/users/profile", { cache: "no-store" })
        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error((payload as { error?: string } | null)?.error || "Unable to load profile")
        }

        if (!isMounted) return
        setProfile(payload)
        setName(payload?.name ?? "")
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadProfile()
    setMounted(true)

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSaveProfile() {
    setSavingProfile(true)
    setStatusMessage("")

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update profile")
      }

      setProfile(payload)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("wealth-track:profile-updated"))
      }
      setStatusMessage("Profile updated.")
    } catch (error) {
      console.error(error)
      setStatusMessage("Profile update failed.")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleResetData() {
    setResetting(true)
    setStatusMessage("")

    try {
      const response = await fetch("/api/users/reset", { method: "DELETE" })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to reset data")
      }

      setStatusMessage("All finance data has been removed from this account.")
      setResetConfirmText("")
      setShowResetDialog(false)
    } catch (error) {
      console.error(error)
      setStatusMessage("Reset failed.")
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <User className="h-5 w-5 text-primary" />
          Profile
        </h2>

        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-secondary/40" />
        ) : (
          <>
            <div className="mb-6 flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 text-2xl font-bold text-primary-foreground">
                {getInitials(profile?.name)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{profile?.name || "Unnamed user"}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                <Input id="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 border-border/50 bg-secondary/30" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={profile?.email ?? ""} readOnly className="mt-1.5 border-border/50 bg-secondary/30 text-muted-foreground" />
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile || !name.trim()} className="gap-2">
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          {mounted && theme === "light" ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          Appearance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              theme === "dark" ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Dark</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Keep the current neon dashboard look as the default theme.</p>
          </button>
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "rounded-xl border-2 p-4 text-left transition-all",
              theme === "light" ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-primary/50"
            )}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Light</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Switch to a brighter interface while keeping the same Wealth Track accent colors.</p>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <Globe className="h-5 w-5 text-primary" />
          Currency
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">Current preview: {formatCurrency(12845.72)}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => setSelectedCurrency(currency.code)}
              className={cn(
                "flex items-center justify-between rounded-lg border-2 p-3 transition-all",
                selectedCurrency === currency.code
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{currency.symbol}</span>
                <span className="text-sm text-muted-foreground">{currency.code}</span>
              </div>
              {selectedCurrency === currency.code ? <Check className="h-4 w-4 text-primary" /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-destructive">
          <Trash2 className="h-5 w-5" />
          Danger Zone
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">This removes all transactions, budgets, goals, and AI chat history for your account.</p>
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Reset All Data
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Reset All Data</DialogTitle>
              <DialogDescription>This action cannot be undone. Type DELETE to confirm permanent removal of your finance data.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="confirm" className="text-sm text-muted-foreground">Type DELETE to confirm</Label>
              <Input id="confirm" value={resetConfirmText} onChange={(event) => setResetConfirmText(event.target.value)} className="mt-2" placeholder="DELETE" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
              <Button variant="destructive" disabled={resetConfirmText !== "DELETE" || resetting} onClick={handleResetData}>
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Reset Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {statusMessage ? <div className="rounded-lg border border-border/50 bg-card px-4 py-3 text-sm text-muted-foreground">{statusMessage}</div> : null}

      <Button variant="outline" className="w-full gap-2 bg-transparent text-muted-foreground hover:border-destructive/50 hover:text-destructive" onClick={() => signOut({ callbackUrl: "/" })}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
