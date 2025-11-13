import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type ThemeMode = 'graduation' | 'corporate'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'gradumarketing:theme-mode'

const getInitialMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'graduation'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'graduation' || stored === 'corporate') {
    return stored
  }

  return 'graduation'
}

type ThemeProviderProps = {
  children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  useEffect(() => {
    if (typeof window === 'undefined') return
    document.documentElement.dataset.themeMode = mode
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () => setMode((prev) => (prev === 'graduation' ? 'corporate' : 'graduation')),
    }),
    [mode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useThemeMode = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider')
  }
  return context
}
