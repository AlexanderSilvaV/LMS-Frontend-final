"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative h-10 w-10 rounded-xl bg-unab-gray-100/50 hover:bg-unab-gray-200/70 dark:bg-unab-navy/30 dark:hover:bg-unab-navy/50 border-none transition-all duration-300 hover:scale-105 group"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-unab-navy/20 to-unab-red/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
      
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 dark:-rotate-180 dark:scale-0 text-unab-navy group-hover:text-unab-red" />
      <Moon className="absolute h-5 w-5 rotate-180 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-unab-red-light group-hover:text-yellow-300" />
      
      {/* Subtle border effect */}
      <div className="absolute inset-0 rounded-xl border border-unab-gray-300/30 dark:border-unab-navy-light/30 group-hover:border-unab-red/40 dark:group-hover:border-unab-red-light/40 transition-colors duration-300"></div>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
