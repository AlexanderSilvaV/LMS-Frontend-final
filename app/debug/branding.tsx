"use client"

import React from 'react'
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UNABOfficialLogo, UNABLogoCompact } from "@/components/unab-official-logo"

export default function BrandingPage() {
  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">
              Identidad Visual UNAB
            </h1>
            <p className="text-unab-gray-600 dark:text-white">
              Logo oficial de la Universidad Andrés Bello integrado al sistema LMS
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logo Oficial Completo */}
            <Card className="border-unab-gray-200 dark:border-unab-navy-light">
              <CardHeader>
                <CardTitle className="text-unab-navy dark:text-white">Logo Oficial Completo</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white dark:bg-unab-gray-100 p-8 rounded-lg">
                  <UNABOfficialLogo width={200} height={240} />
                </div>
                <p className="text-sm text-unab-gray-600 dark:text-white text-center">
                  Logo principal para uso en páginas de bienvenida, documentos oficiales y materiales promocionales
                </p>
              </CardContent>
            </Card>

            {/* Logo Compacto */}
            <Card className="border-unab-gray-200 dark:border-unab-navy-light">
              <CardHeader>
                <CardTitle className="text-unab-navy dark:text-white">Logo Compacto</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-8">
                  <div className="bg-white dark:bg-unab-gray-100 p-4 rounded-lg">
                    <UNABLogoCompact size={60} />
                  </div>
                  <div className="bg-white dark:bg-unab-gray-100 p-3 rounded-lg">
                    <UNABLogoCompact size={40} />
                  </div>
                  <div className="bg-white dark:bg-unab-gray-100 p-2 rounded-lg">
                    <UNABLogoCompact size={28} />
                  </div>
                </div>
                <p className="text-sm text-unab-gray-600 dark:text-white text-center">
                  Versión compacta para uso en navegación, sidebar, y espacios reducidos
                </p>
              </CardContent>
            </Card>

            {/* Paleta de Colores */}
            <Card className="border-unab-gray-200 dark:border-unab-navy-light lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-unab-navy dark:text-white">Paleta de Colores Institucional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {/* Navy Principal */}
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-lg bg-unab-navy border-2 border-unab-gray-300"></div>
                    <h4 className="font-semibold text-unab-navy dark:text-white">Navy Principal</h4>
                    <p className="text-xs text-unab-gray-600 dark:text-white">#2C3E50</p>
                    <p className="text-xs text-unab-gray-500 dark:text-unab-gray-400">Institucional</p>
                  </div>

                  {/* Rojo Secundario */}
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-lg bg-unab-red border-2 border-unab-gray-300"></div>
                    <h4 className="font-semibold text-unab-navy dark:text-white">Rojo UNAB</h4>
                    <p className="text-xs text-unab-gray-600 dark:text-white">#C53030</p>
                    <p className="text-xs text-unab-gray-500 dark:text-unab-gray-400">Acciones/Énfasis</p>
                  </div>

                  {/* Gris Neutro */}
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-lg bg-unab-gray-600 border-2 border-unab-gray-300"></div>
                    <h4 className="font-semibold text-unab-navy dark:text-white">Gris UNAB</h4>
                    <p className="text-xs text-unab-gray-600 dark:text-white">#495057</p>
                    <p className="text-xs text-unab-gray-500 dark:text-unab-gray-400">Texto/Soporte</p>
                  </div>

                  {/* Blanco */}
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-2 rounded-lg bg-white border-2 border-unab-gray-300"></div>
                    <h4 className="font-semibold text-unab-navy dark:text-white">Blanco</h4>
                    <p className="text-xs text-unab-gray-600 dark:text-white">#FFFFFF</p>
                    <p className="text-xs text-unab-gray-500 dark:text-unab-gray-400">Fondos/Contraste</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Uso en Contexto */}
            <Card className="border-unab-gray-200 dark:border-unab-navy-light lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-unab-navy dark:text-white">Implementación en el Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-unab-navy-dark p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <UNABLogoCompact size={32} />
                      <span className="text-white font-semibold">Página de Login</span>
                    </div>
                    <p className="text-unab-gray-300 text-sm">Logo animado como elemento principal de bienvenida</p>
                  </div>

                  <div className="bg-white dark:bg-unab-navy border border-unab-gray-200 dark:border-unab-navy-light p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <UNABLogoCompact size={24} />
                      <span className="text-unab-navy dark:text-white font-semibold">Sidebar</span>
                    </div>
                    <p className="text-unab-gray-600 dark:text-white text-sm">Logo compacto en la navegación principal</p>
                  </div>

                  <div className="bg-gradient-to-r from-unab-navy to-unab-navy-dark p-4 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <UNABLogoCompact size={28} />
                      <span className="text-white font-semibold">Headers</span>
                    </div>
                    <p className="text-unab-gray-200 text-sm">Identificación institucional en cabeceras</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
