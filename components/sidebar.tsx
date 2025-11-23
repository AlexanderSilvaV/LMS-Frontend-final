"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { UNABLogoCompact } from "./unab-official-logo"
import { AuthenticatedAvatar } from "@/components/authenticated-avatar"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  LogOut,
  Menu,
  GraduationCap,
  FlaskConical,
  User,
  Shield,
  UserCheck,
  ChevronDown,
  Home,
  UserCircle,
  Atom,
  TestTube,
  Microscope,
  ClipboardList,
  MessageSquare,
  Award,
} from "lucide-react"

interface SidebarProps {
  role: "admin" | "teacher" | "student"
}

interface UserProfile {
  nombre: string
  correo: string
  rol: string
  fotoPerfil?: string
}

export function Sidebar({ role }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Load initial user profile
    loadUserProfile()

    // Listen for avatar updates from profile page
    const handleAvatarUpdate = (e: CustomEvent) => {
      try {
        const { avatar, hasAvatar } = e.detail
        setUserProfile((prevProfile) => {
          if (!prevProfile) return prevProfile
          
          return {
            ...prevProfile,
            fotoPerfil: hasAvatar && avatar ? avatar : undefined
          }
        })
      } catch (err) {
        console.warn("avatarUpdated handler error:", err)
      }
    }

    window.addEventListener("avatarUpdated", handleAvatarUpdate as EventListener)
    
    return () => {
      window.removeEventListener("avatarUpdated", handleAvatarUpdate as EventListener)
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        // Set fallback data from localStorage if no token
        setUserProfile({
          nombre: localStorage.getItem("userName") || "Usuario",
          correo: localStorage.getItem("userEmail") || "",
          rol: localStorage.getItem("userRole") || "",
          fotoPerfil: localStorage.getItem("userAvatar") || undefined,
        })
        return
      }

      // Use backendService to fetch profile
      const { backendService } = await import("@/app/lib/backend-service")
      const data = await backendService.getProfile(token)

      const profileData = data.dato || data

      // For bitmap avatars, check if user has avatar and construct URL
      let avatarUrl = null
      if (profileData.TieneAvatar || profileData.tieneAvatar) {
        // Reutilizar el timestamp existente de localStorage si ya existe
        // Solo generar uno nuevo si no hay URL previa
        const existingUrl = localStorage.getItem("userAvatar")
        if (existingUrl && existingUrl.startsWith('/api/profile/photo')) {
          avatarUrl = existingUrl
        } else {
          avatarUrl = `/api/profile/photo?t=${Date.now()}`
        }
      }

      const normalizedProfile = {
        nombre: profileData.nombre || localStorage.getItem("userName") || "Usuario",
        correo: profileData.correo || localStorage.getItem("userEmail") || "",
        rol: profileData.rol || localStorage.getItem("userRole") || "",
        fotoPerfil: avatarUrl || undefined
      }

      setUserProfile(normalizedProfile)

      // Update localStorage for consistency
      if (avatarUrl) {
        localStorage.setItem("userAvatar", avatarUrl)
        localStorage.setItem("userHasAvatar", "true")
      } else {
        localStorage.removeItem("userAvatar")
        localStorage.setItem("userHasAvatar", "false")
      }
    } catch (error) {
      console.error("Error loading user profile in sidebar:", error)
      // Set fallback data from localStorage
      const avatarFromStorage = localStorage.getItem("userAvatar")
      setUserProfile({
        nombre: localStorage.getItem("userName") || "Usuario",
        correo: localStorage.getItem("userEmail") || "",
        rol: localStorage.getItem("userRole") || "",
        fotoPerfil: avatarFromStorage || undefined,
      })
    }
  }

  const adminNavItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Usuarios",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Cursos",
      href: "/admin/courses",
      icon: BookOpen,
    },
    {
      title: "Módulos",
      href: "/admin/modules",
      icon: FileText,
    },
    {
      title: "Materiales",
      href: "/admin/materials",
      icon: TestTube,
    },
      {
        title: "Mi Perfil",
        href: "/profile",
        icon: UserCircle,
      },
  ]

  const teacherNavItems = [
    {
      title: "Dashboard",
      href: "/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Mis Cursos",
      href: "/teacher/courses",
      icon: BookOpen,
    },
    {
      title: "Evaluaciones",
      href: "/teacher/evaluaciones",
      icon: ClipboardList,
    },
    {
      title: "Foros",
      href: "/teacher/foros",
      icon: MessageSquare,
    },
    {
      title: "Módulos",
      href: "/teacher/modules",
      icon: FileText,
    },
    {
      title: "Materiales",
      href: "/teacher/materials",
      icon: TestTube,
    },
    {
      title: "Laboratorios",
      href: "/teacher/labs",
      icon: Microscope,
    },
      {
        title: "Mi Perfil",
        href: "/profile",
        icon: UserCircle,
      },
  ]

  const studentNavItems = [
    {
      title: "Dashboard",
      href: "/student/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Mis Cursos",
      href: "/student/courses",
      icon: BookOpen,
    },
    {
      title: "Evaluaciones",
      href: "/student/evaluaciones",
      icon: ClipboardList,
    },
    {
      title: "Notas",
      href: "/student/notas",
      icon: Award,
    },
    {
      title: "Foros",
      href: "/student/foros",
      icon: MessageSquare,
    },
    // PESTAÑA LABORATORIOS OCULTA PARA ESTUDIANTES - No habilitada para rol Estudiante
    // {
    //   title: "Laboratorios",
    //   href: "/student/labs",
    //   icon: Atom,
    // },
      {
        title: "Mi Perfil",
        href: "/profile",
        icon: UserCircle,
      },
  ]

  const getNavItems = () => {
    switch (role) {
      case "admin":
        return adminNavItems
      case "teacher":
        return teacherNavItems
      case "student":
        return studentNavItems
      default:
        return []
    }
  }

  const getRoleInfo = () => {
    if (!userProfile) return { title: "Usuario", icon: User, color: "text-unab-gray-600 dark:text-white" }

    switch (userProfile.rol) {
      case "Administrador":
        return {
          title: "Administrador",
          icon: Shield,
          color: "text-unab-red dark:text-unab-red-light",
        }
      case "Docente":
        return {
          title: "Docente",
          icon: GraduationCap,
          color: "text-unab-navy dark:text-unab-navy-light",
        }
      case "Alumno":
      default:
        return {
          title: "Estudiante",
          icon: UserCheck,
          color: "text-unab-gray-600 dark:text-unab-gray-300",
        }
    }
  }

  const handleLogout = () => {
    try {
      // Clear all localStorage items
      localStorage.removeItem("token")
      localStorage.removeItem("userRole")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userId")

      // Clear all localStorage (more robust)
      localStorage.clear()

      // Use window.location.href for complete page refresh and cleanup
      window.location.href = "/"
    } catch (error) {
      // Fallback if there's any issue
      console.error("Logout error:", error)
      router.push("/")
    }
  }

  const navigateToProfile = () => {
    router.push("/profile")
  }

  const navigateHome = () => {
    switch (role) {
      case "admin":
        router.push("/admin/dashboard")
        break
      case "teacher":
        router.push("/teacher/dashboard")
        break
      case "student":
        router.push("/student/dashboard")
        break
      default:
        router.push("/")
    }
  }

  const roleInfo = getRoleInfo()

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-20 items-center border-b px-6 lg:h-[80px] lg:px-8 bg-unab-navy dark:bg-unab-navy-dark relative overflow-hidden">
        {/* Decorative chemical elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-3 right-6 w-8 h-8 rounded-full border-2 border-white animate-pulse"></div>
          <div className="absolute bottom-3 right-10 w-4 h-4 rounded-full bg-white opacity-50"></div>
          <div className="absolute top-6 right-16 w-3 h-3 rounded-full bg-unab-red-light"></div>
          <div className="absolute bottom-6 right-20 w-5 h-5 rounded-full border border-unab-red-light opacity-30"></div>
        </div>
        
        <Link href="/" className="flex items-center gap-4 font-semibold relative z-10">
          <div className="w-10 h-10 relative">
            <Image
              src="/Logo.png"
              alt="UNAB Logo"
              fill
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl text-white leading-tight">3D LAB LMS</span>
            <span className="text-sm text-unab-red-light leading-tight">Laboratorios Virtuales UNAB</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 bg-white dark:bg-unab-navy-dark/50">
        <nav className="grid items-start px-4 text-base font-medium lg:px-6 gap-2 relative z-10">
          {getNavItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-4 rounded-lg px-4 py-4 text-unab-gray-600 dark:text-unab-gray-300 transition-all hover:text-unab-navy dark:hover:text-white hover:bg-unab-gray-100 dark:hover:bg-unab-navy/30 relative group",
                pathname === item.href && "bg-unab-red/10 dark:bg-unab-red/20 text-unab-red dark:text-unab-red-light border border-unab-red/20 shadow-sm",
                pathname?.startsWith(item.href) && item.href !== "/student/dashboard" && "bg-unab-red/5 dark:bg-unab-red/10 text-unab-red dark:text-unab-red-light",
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {/* Chemical bubble effect on hover */}
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-unab-red opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300"></div>
              </div>
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="border-t border-unab-gray-200 dark:border-unab-navy p-6 bg-unab-gray-50 dark:bg-unab-navy-dark/30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-auto p-3 rounded-lg">
              <div className="flex items-center gap-4 text-left w-full">
                <AuthenticatedAvatar
                  src={userProfile?.fotoPerfil}
                  alt={userProfile?.nombre}
                  fallback={userProfile?.nombre.charAt(0).toUpperCase() || "U"}
                  size="md"
                  className="ring-2 ring-unab-red/20 dark:ring-unab-red-light/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-unab-navy dark:text-white truncate">
                    {userProfile?.nombre || "Usuario"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <roleInfo.icon className="h-4 w-4" />
                    <p className={`text-sm ${roleInfo.color} truncate font-medium`}>{roleInfo.title}</p>
                  </div>
                </div>
                <ChevronDown className="h-5 w-5 text-unab-gray-400 dark:text-unab-gray-300" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-unab-navy border-unab-gray-200 dark:border-unab-navy-light">
            <DropdownMenuItem onClick={navigateHome} className="hover:bg-unab-gray-100 dark:hover:bg-unab-navy-light/30 text-unab-gray-700 dark:text-unab-gray-200 p-3">
              <Home className="mr-3 h-5 w-5" />
              <span className="text-base">Inicio</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={navigateToProfile} className="hover:bg-unab-gray-100 dark:hover:bg-unab-navy-light/30 text-unab-gray-700 dark:text-unab-gray-200 p-3">
              <UserCircle className="mr-3 h-5 w-5" />
              <span className="text-base">Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-unab-gray-200 dark:bg-unab-navy-light my-2" />
            <DropdownMenuItem onClick={handleLogout} className="text-unab-red dark:text-unab-red-light hover:bg-unab-red/10 dark:hover:bg-unab-red/20 p-3">
              <LogOut className="mr-3 h-5 w-5" />
              <span className="text-base">Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-unab-navy border-unab-gray-200 dark:border-unab-navy-light shadow-lg hover:bg-unab-gray-50 dark:hover:bg-unab-navy-light transition-all duration-200">
            <Menu className="h-5 w-5 text-unab-navy dark:text-white" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-64 bg-white dark:bg-unab-navy-dark">
          <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 border-r bg-unab-gray-50 dark:bg-unab-navy-dark lg:shadow-lg">
        <SidebarContent />
      </div>
    </>
  )
}
