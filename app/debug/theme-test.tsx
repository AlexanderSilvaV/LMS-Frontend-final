"use client"

import React from 'react'
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  BookOpen,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  UserCheck
} from "lucide-react"
import { UNABLogoCompact } from "@/components/unab-official-logo"

// Página de prueba para verificar que todos los componentes se ven bien en modo claro y oscuro
export default function ThemeTestPage() {
  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header with Theme Toggle */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">
                Test de Modo Claro/Oscuro - UNAB
              </h1>
              <p className="text-unab-gray-600 dark:text-white">
                Verifica que todos los componentes se vean correctos en ambos modos
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-unab-red/10 text-unab-red border-unab-red/20">
                <Shield className="h-3 w-3 mr-1" />
                Administrador
              </Badge>
              <ThemeToggle />
            </div>
          </div>

          {/* Alert Examples */}
          <div className="space-y-4 mb-8">
            <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Estado exitoso - Verde para éxito</AlertDescription>
            </Alert>
            
            <Alert variant="destructive" className="bg-unab-red/10 border-unab-red text-unab-red dark:bg-unab-red/20 dark:text-unab-red-light">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Estado de error - Rojo UNAB para errores</AlertDescription>
            </Alert>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-unab-gray-200 dark:border-unab-navy-light">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Usuarios</p>
                    <p className="text-3xl font-bold text-unab-navy dark:text-white">142</p>
                  </div>
                  <div className="p-3 rounded-full bg-unab-navy/10 dark:bg-unab-navy/20">
                    <Users className="h-6 w-6 text-unab-navy dark:text-unab-navy-light" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-unab-gray-200 dark:border-unab-navy-light">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Cursos</p>
                    <p className="text-3xl font-bold text-unab-navy dark:text-white">24</p>
                  </div>
                  <div className="p-3 rounded-full bg-unab-red/10 dark:bg-unab-red/20">
                    <BookOpen className="h-6 w-6 text-unab-red dark:text-unab-red-light" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-unab-gray-200 dark:border-unab-navy-light">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Materiales</p>
                    <p className="text-3xl font-bold text-unab-navy dark:text-white">89</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-unab-gray-200 dark:border-unab-navy-light">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-unab-gray-600 dark:text-unab-gray-400">Laboratorios</p>
                    <p className="text-3xl font-bold text-unab-navy dark:text-white">12</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <UNABLogoCompact size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Example */}
          <Card className="mb-8 border-unab-gray-200 dark:border-unab-navy-light">
            <CardHeader>
              <CardTitle className="text-unab-navy dark:text-white">Formulario de Prueba</CardTitle>
              <CardDescription className="text-unab-gray-600 dark:text-white">
                Campos de entrada con estilos UNAB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-unab-navy dark:text-white">Nombre</Label>
                  <Input 
                    id="nombre" 
                    placeholder="Ingresa tu nombre"
                    className="border-unab-gray-300 dark:border-unab-navy-light focus:border-unab-red focus:ring-unab-red"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-unab-navy dark:text-white">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="tu@ejemplo.com"
                    className="border-unab-gray-300 dark:border-unab-navy-light focus:border-unab-red focus:ring-unab-red"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button className="bg-unab-red hover:bg-unab-red-dark text-white">
                  Botón Principal
                </Button>
                <Button variant="outline" className="border-unab-navy text-unab-navy hover:bg-unab-navy hover:text-white">
                  Botón Secundario
                </Button>
                <Button variant="ghost" className="text-unab-gray-600 hover:text-unab-navy dark:text-unab-gray-400 dark:hover:text-white">
                  Botón Ghost
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Badges Examples */}
          <Card className="border-unab-gray-200 dark:border-unab-navy-light">
            <CardHeader>
              <CardTitle className="text-unab-navy dark:text-white">Badges de Roles</CardTitle>
              <CardDescription className="text-unab-gray-600 dark:text-white">
                Diferentes tipos de badges con colores UNAB
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Badge className="bg-unab-red/10 text-unab-red border-unab-red/20">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrador
                </Badge>
                <Badge className="bg-unab-navy/10 text-unab-navy border-unab-navy/20 dark:bg-unab-navy/20 dark:text-unab-navy-light">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Docente
                </Badge>
                <Badge className="bg-unab-gray-100 text-unab-gray-700 border-unab-gray-300 dark:bg-unab-gray-800 dark:text-white">
                  <UserCheck className="h-3 w-3 mr-1" />
                  Estudiante
                </Badge>
                <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Activo
                </Badge>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
