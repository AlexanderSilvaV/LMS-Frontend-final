"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import { AnimatedAtom } from "@/components/animated-atom"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    if (token) {
      const role = localStorage.getItem("userRole")
      if (role) {
        redirectByRole(role)
      }
    }

    // Initialize particles
    initParticles()
  }, [])

  const initParticles = () => {
    // This would normally be implemented with a library like particles.js
    // For now, we'll create a simple CSS animation
    const particlesContainer = document.getElementById("particles-container")
    if (!particlesContainer) return

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.style.left = `${Math.random() * 100}%`
      particle.style.top = `${Math.random() * 100}%`
      particle.style.width = `${Math.random() * 3 + 1}px`
      particle.style.height = particle.style.width
      particle.style.opacity = `${Math.random() * 0.5 + 0.1}`
      particle.style.animationDuration = `${Math.random() * 20 + 10}s`
      particle.style.animationDelay = `${Math.random() * 5}s`
      particlesContainer.appendChild(particle)
    }
  }

  const redirectByRole = (role: string) => {
    switch (role) {
      case "Administrador":
        router.push("/admin/dashboard")
        break
      case "Docente":
        router.push("/teacher/dashboard")
        break
      case "Alumno":
        router.push("/student/dashboard")
        break
      default:
        router.push("/student/dashboard")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Use the frontend proxy route which maps fields to the backend consistently
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Error al iniciar sesión"

        // Handle different HTTP status codes with specific messages first
        switch (response.status) {
          case 400:
            errorMessage = "Datos de inicio de sesión inválidos. Verifica tu email y contraseña."
            break
          case 401:
            errorMessage = "Email o contraseña incorrectos. Inténtalo de nuevo."
            break
          case 403:
            errorMessage = "Tu cuenta está suspendida o no tienes permisos para acceder."
            break
          case 404:
            errorMessage = "Usuario no encontrado. Verifica tu email."
            break
          case 429:
            errorMessage = "Demasiados intentos de inicio de sesión. Inténtalo más tarde."
            break
          case 500:
            // Try to parse JSON for server-provided error message
            try {
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.mensaje || errorData.message || "Error interno del servidor. Inténtalo más tarde."
            } catch {
              errorMessage = "Error interno del servidor. Inténtalo más tarde."
            }
            break
          default:
            // Only try to parse server message if we don't have a specific handler
            try {
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.mensaje || errorData.message || `Error ${response.status}: ${errorText || 'Error desconocido'}`
            } catch {
              errorMessage = `Error ${response.status}: ${errorText || 'Error desconocido'}`
            }
        }

        setError(errorMessage)
        return
      }

      const data = await response.json()

      if (data.token) {
        localStorage.setItem("token", data.token)

        // Get user profile to determine role using our API route
        // Use backendService to fetch profile (ensures correct endpoint and token handling)
        const { backendService } = await import("@/app/lib/backend-service")
        try {
          const profileData = await backendService.getProfile(data.token)
          const dato = profileData.dato || profileData
          localStorage.setItem("userRole", dato.rol)
          localStorage.setItem("userName", dato.nombre)
          localStorage.setItem("userEmail", dato.correo)
          redirectByRole(dato.rol)
        } catch (err) {
          console.error("Error al obtener perfil:", err)
          localStorage.removeItem("token")
          setError("Error al obtener información del usuario. Tu sesión puede haber expirado.")
        }
      } else {
        setError(data.mensaje || data.message || "Error al iniciar sesión: respuesta inválida del servidor")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      setError("Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotPasswordLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Error al enviar el correo de recuperación"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.mensaje || errorData.message || errorMessage
        } catch {
          switch (response.status) {
            case 400:
              errorMessage = "Email inválido. Verifica que el email esté correcto."
              break
            case 404:
              errorMessage = "No se encontró una cuenta con este email."
              break
            case 429:
              errorMessage = "Demasiadas solicitudes. Inténtalo más tarde."
              break
            case 500:
              errorMessage = "Error interno del servidor. Inténtalo más tarde."
              break
            default:
              errorMessage = `Error ${response.status}: ${errorText || 'Error desconocido'}`
          }
        }

        setError(errorMessage)
        return
      }

      const data = await response.json()

      if (response.ok) {
        setForgotPasswordSuccess(true)
      } else {
        setError(data.mensaje || data.message || "Error al enviar el correo de recuperación")
      }
    } catch (error) {
      console.error("Error de conexión:", error)
      setError("Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.")
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  const resetForgotPasswordForm = () => {
    setShowForgotPassword(false)
    setForgotPasswordEmail("")
    setForgotPasswordSuccess(false)
    setError("")
  }

  return (
    <div className="min-h-screen bg-unab-navy-dark flex relative overflow-hidden">
      {/* Particles background */}
      <div id="particles-container" className="absolute inset-0 z-0">
        {/* Particles will be added here by JS */}
      </div>

      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-unab-navy-dark via-unab-navy to-unab-navy-dark z-0 opacity-90"></div>

      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <motion.div
              className="flex items-center justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="w-28 h-28 relative">
                <Image
                  src="/Logo.png"
                  alt="UNAB Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
            <motion.h1
              className="text-3xl font-bold text-white mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              UNAB 3D LAB LMS
            </motion.h1>
            <motion.p
              className="text-unab-gray-300 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Sistema de gestión del aprendizaje Universidad Andrés Bello
            </motion.p>
          </div>

          {/* Login Form */}
          <motion.div
            className="space-y-6 bg-gray-900/50 backdrop-blur-md p-8 rounded-xl border border-gray-800"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {!showForgotPassword ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-6">Iniciar sesión</h2>
                <p className="text-gray-400 text-sm mb-6">Ingresa tus credenciales para acceder al sistema</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white text-sm">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-unab-navy/70 border-unab-gray-600 text-white placeholder-unab-gray-400 focus:border-unab-red focus:ring-unab-red"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white text-sm">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-unab-navy/70 border-unab-gray-600 text-white placeholder-unab-gray-400 focus:border-unab-red focus:ring-unab-red pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-unab-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-unab-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="bg-unab-red/20 border-unab-red text-unab-red-light">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-unab-red hover:bg-unab-red-dark text-white font-medium py-3 rounded-lg transition-colors duration-200"
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
                  </Button>
                </form>

                {/* Forgot Password Link */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-unab-red-light hover:text-white text-sm transition-colors duration-200 underline hover:no-underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-unab-gray-300 text-xs text-center">
                    El registro de nuevos usuarios solo puede ser realizado por un administrador del sistema.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForgotPasswordForm}
                    className="text-unab-gray-300 hover:text-white p-0 mr-3"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold text-white">Recuperar contraseña</h2>
                </div>

                {!forgotPasswordSuccess ? (
                  <>
                    <p className="text-gray-400 text-sm mb-6">
                      Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </p>

                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email" className="text-white text-sm">
                          Correo electrónico
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="tu@ejemplo.com"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            required
                            className="bg-gray-800/70 border-gray-700 text-white placeholder-gray-500 focus:border-unab-red focus:ring-unab-red/20 pl-10"
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        className="w-full bg-unab-red hover:bg-unab-red-dark text-white font-medium py-3 rounded-lg transition-colors duration-200"
                        disabled={forgotPasswordLoading}
                      >
                        {forgotPasswordLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-unab-navy/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-8 w-8 text-unab-navy dark:text-unab-navy-light" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">¡Correo enviado!</h3>
                    <p className="text-gray-400 text-sm">
                      Hemos enviado un enlace de recuperación a{" "}
                      <strong className="text-white">{forgotPasswordEmail}</strong>. Revisa tu bandeja de entrada y
                      sigue las instrucciones para restablecer tu contraseña.
                    </p>
                    <Button
                      onClick={resetForgotPasswordForm}
                      variant="outline"
                      className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
                    >
                      Volver al login
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="flex-1 hidden lg:flex items-center justify-center p-8 z-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <div className="mb-8 relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-unab-red/10 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            <AnimatedAtom />
          </div>
          <motion.h2
            className="text-3xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Laboratorios Virtuales 3D
          </motion.h2>
          <motion.p
            className="text-gray-400 text-lg max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            Experimenta con química en un entorno virtual inmersivo
          </motion.p>
        </motion.div>
      </div>

      {/* Orbital elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          className="absolute w-64 h-64 rounded-full border border-unab-red/20"
          style={{ top: "50%", left: "50%", marginLeft: "-8rem", marginTop: "-8rem" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <motion.div
            className="absolute w-4 h-4 bg-unab-red rounded-full"
            style={{ top: 0, left: "50%", marginLeft: "-0.5rem" }}
          />
        </motion.div>
        <motion.div
          className="absolute w-96 h-96 rounded-full border border-unab-navy/10"
          style={{ top: "50%", left: "50%", marginLeft: "-12rem", marginTop: "-12rem" }}
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <motion.div
            className="absolute w-3 h-3 bg-unab-navy rounded-full"
            style={{ top: 0, left: "50%", marginLeft: "-0.375rem" }}
          />
        </motion.div>
      </div>

      {/* Add CSS for particles */}
      <style jsx global>{`
        .particle {
          position: absolute;
          background-color: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          pointer-events: none;
          animation: float linear infinite;
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(0);
          }
          75% {
            transform: translateY(-20px) translateX(-10px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
