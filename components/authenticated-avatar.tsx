"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AuthenticatedAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function AuthenticatedAvatar({
  src,
  alt = "Avatar",
  fallback = "U",
  className = "",
  size = "md"
}: AuthenticatedAvatarProps) {
  const [authenticatedSrc, setAuthenticatedSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-24 w-24"
  }

  useEffect(() => {
    // Función para cargar la imagen autenticada
    const loadAuthenticatedImage = async () => {
      // Si no hay src, limpiar
      if (!src) {
        setAuthenticatedSrc(null)
        setLoading(false)
        return
      }

      // Si el src no es una ruta de API que requiere autenticación, usarlo directamente
      if (!src.startsWith('/api/profile/photo')) {
        setAuthenticatedSrc(src)
        setLoading(false)
        return
      }

      // Cargar imagen autenticada desde API
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        if (!token) {
          setAuthenticatedSrc(null)
          return
        }

        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(src, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const blob = await response.blob()
          // Verificar que el blob no esté vacío
          if (blob.size > 0) {
            // Clean up previous object URL if it exists
            if (authenticatedSrc && authenticatedSrc.startsWith('blob:')) {
              URL.revokeObjectURL(authenticatedSrc)
            }
            const objectUrl = URL.createObjectURL(blob)
            setAuthenticatedSrc(objectUrl)
          } else {
            console.warn("Received empty blob for avatar")
            setAuthenticatedSrc(null)
          }
        } else {
          console.warn(`Failed to load avatar: ${response.status}`)
          setAuthenticatedSrc(null)
        }
      } catch (error) {
        // Si es un AbortError, no registrarlo (es un timeout esperado)
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn("Avatar load timeout")
        } else {
          console.error("Error loading authenticated image:", error)
        }
        setAuthenticatedSrc(null)
      } finally {
        setLoading(false)
      }
    }

    loadAuthenticatedImage()

    // Cleanup: revocar URL de blob cuando el componente se desmonte o src cambie
    return () => {
      if (authenticatedSrc && authenticatedSrc.startsWith('blob:')) {
        URL.revokeObjectURL(authenticatedSrc)
      }
    }
  }, [src]) // Re-ejecutar cuando src cambie

  return (
    <Avatar className={`${className.includes('h-') && className.includes('w-') ? className : sizeClasses[size]} ${className}`}>
      {loading ? (
        <AvatarFallback>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-unab-red"></div>
        </AvatarFallback>
      ) : authenticatedSrc ? (
        <AvatarImage src={authenticatedSrc} alt={alt} />
      ) : (
        <AvatarFallback className={className.includes('bg-') ? className : "bg-unab-red/10 dark:bg-unab-red/20 text-unab-red dark:text-unab-red-light border border-unab-red/30"}>
          {fallback}
        </AvatarFallback>
      )}
    </Avatar>
  )
}
