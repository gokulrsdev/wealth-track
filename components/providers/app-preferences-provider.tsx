"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

export type SupportedCurrency = "USD" | "EUR" | "GBP" | "INR" | "JPY"

type Preferences = {
  selectedCurrency: SupportedCurrency
}

type AddNotificationInput = {
  title: string
  description: string
  kind?: "info" | "success" | "warning" | "error"
  dedupeKey?: string
  silent?: boolean
}

type AppPreferencesContextValue = {
  selectedCurrency: SupportedCurrency
  setSelectedCurrency: (currency: SupportedCurrency) => void
  addNotification: (input: AddNotificationInput) => void
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions) => string
}

const preferencesStorageKey = "wealth-track-preferences"
const legacyPreferencesStorageKey = "finance-tracker-preferences"
const preferencesMigrationKey = "wealth-track-preferences-migration-v2"

const defaultPreferences: Preferences = {
  selectedCurrency: "INR",
}

const validCurrencies: SupportedCurrency[] = ["USD", "EUR", "GBP", "INR", "JPY"]

const currencyLocales: Record<SupportedCurrency, string> = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  INR: "en-IN",
  JPY: "ja-JP",
}

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null)

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    let nextPreferences = defaultPreferences
    const savedPreferences =
      window.localStorage.getItem(preferencesStorageKey) ??
      window.localStorage.getItem(legacyPreferencesStorageKey)

    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences) as Preferences
        const parsedCurrency = validCurrencies.includes(parsed.selectedCurrency as SupportedCurrency)
          ? (parsed.selectedCurrency as SupportedCurrency)
          : undefined

        const hasMigratedCurrencyDefault = window.localStorage.getItem(preferencesMigrationKey) === "true"
        const shouldMigrateOldUsdDefault = !hasMigratedCurrencyDefault && parsedCurrency === "USD"

        nextPreferences = {
          selectedCurrency: shouldMigrateOldUsdDefault ? "INR" : parsedCurrency || defaultPreferences.selectedCurrency,
        }

        if (shouldMigrateOldUsdDefault || !hasMigratedCurrencyDefault) {
          window.localStorage.setItem(preferencesMigrationKey, "true")
        }
      } catch {
        window.localStorage.removeItem(preferencesStorageKey)
      }
    } else {
      window.localStorage.setItem(preferencesMigrationKey, "true")
    }

    const timer = window.setTimeout(() => {
      setPreferences(nextPreferences)
      setHasHydrated(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!hasHydrated) return

    window.localStorage.setItem(preferencesStorageKey, JSON.stringify(preferences))
  }, [hasHydrated, preferences])

  function setSelectedCurrency(currency: SupportedCurrency) {
    setPreferences((current) => ({ ...current, selectedCurrency: currency }))
  }

  function addNotification({ title, description, kind = "info", silent = false }: AddNotificationInput) {
    if (silent) return

    toast({
      title,
      description,
      variant: kind === "error" ? "destructive" : undefined,
    })
  }

  function formatCurrency(value: number, options: Intl.NumberFormatOptions = {}) {
    const amount = Number.isFinite(value) ? value : 0
    return new Intl.NumberFormat(currencyLocales[preferences.selectedCurrency], {
      style: "currency",
      currency: preferences.selectedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount)
  }

  const value: AppPreferencesContextValue = {
    selectedCurrency: preferences.selectedCurrency,
    setSelectedCurrency,
    addNotification,
    formatCurrency,
  }

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext)

  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider")
  }

  return context
}