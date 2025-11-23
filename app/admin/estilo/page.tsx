"use client"

import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Palette, 
  Type, 
  Layout, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X,
  Copy,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Search,
  Settings,
  User,
  Home,
  BookOpen,
  Users,
  BarChart3
} from "lucide-react"
import { useState } from "react"

export default function StyleGuidePage() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedColor(type)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const colors = {
    primary: {
      name: "UNAB Navy",
      colors: [
        { name: "Navy Primary", value: "#2C3E50", class: "bg-unab-navy" },
        { name: "Navy Light", value: "#34495E", class: "bg-unab-navy-light" },
        { name: "Navy Dark", value: "#1A252F", class: "bg-unab-navy-dark" },
      ]
    },
    secondary: {
      name: "UNAB Red",
      colors: [
        { name: "Red Primary", value: "#C53030", class: "bg-unab-red" },
        { name: "Red Light", value: "#E53E3E", class: "bg-unab-red-light" },
        { name: "Red Dark", value: "#9B2C2C", class: "bg-unab-red-dark" },
      ]
    },
    grays: {
      name: "UNAB Grays",
      colors: [
        { name: "Gray 50", value: "#F8FAFC", class: "bg-unab-gray-50" },
        { name: "Gray 100", value: "#F1F5F9", class: "bg-unab-gray-100" },
        { name: "Gray 200", value: "#E2E8F0", class: "bg-unab-gray-200" },
        { name: "Gray 300", value: "#CBD5E1", class: "bg-unab-gray-300" },
        { name: "Gray 400", value: "#94A3B8", class: "bg-unab-gray-400" },
        { name: "Gray 500", value: "#64748B", class: "bg-unab-gray-500" },
        { name: "Gray 600", value: "#475569", class: "bg-unab-gray-600" },
        { name: "Gray 700", value: "#334155", class: "bg-unab-gray-700" },
        { name: "Gray 800", value: "#1E293B", class: "bg-unab-gray-800" },
        { name: "Gray 900", value: "#0F172A", class: "bg-unab-gray-900" },
      ]
    }
  }

  return (
    <div className="flex min-h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">
              Guía de Estilos UNAB 3D LAB
            </h1>
            <p className="text-unab-gray-600 dark:text-white">
              Sistema de diseño y componentes para el LMS de Laboratorios Virtuales de la Universidad Andrés Bello
            </p>
          </div>

          <Tabs defaultValue="colors" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="colors">Colores</TabsTrigger>
              <TabsTrigger value="typography">Tipografía</TabsTrigger>
              <TabsTrigger value="components">Componentes</TabsTrigger>
              <TabsTrigger value="forms">Formularios</TabsTrigger>
              <TabsTrigger value="icons">Iconografía</TabsTrigger>
            </TabsList>

            {/* Colores */}
            <TabsContent value="colors" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Paleta de Colores UNAB
                  </CardTitle>
                  <CardDescription>
                    Colores oficiales de la Universidad Andrés Bello para el sistema LMS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {Object.entries(colors).map(([key, category]) => (
                    <div key={key} className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">
                        {category.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {category.colors.map((color, index) => (
                          <Card key={index} className="border-2 hover:border-unab-red transition-colors">
                            <CardContent className="p-4">
                              <div 
                                className={`${color.class} h-20 w-full rounded-lg mb-3 border border-unab-gray-200 dark:border-unab-gray-700`}
                              />
                              <div className="space-y-2">
                                <p className="font-semibold text-sm text-unab-navy dark:text-white">
                                  {color.name}
                                </p>
                                <div className="space-y-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => copyToClipboard(color.value, color.name)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    {copiedColor === color.name ? "¡Copiado!" : color.value}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => copyToClipboard(color.class, `${color.name}-class`)}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    {copiedColor === `${color.name}-class` ? "¡Copiado!" : color.class}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tipografía */}
            <TabsContent value="typography" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Sistema Tipográfico
                  </CardTitle>
                  <CardDescription>
                    Jerarquía y estilos de texto para el sistema UNAB 3D LAB
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Títulos</h3>
                      <div className="space-y-4">
                        <div className="p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                          <h1 className="text-4xl font-bold text-unab-navy dark:text-white mb-2">
                            Título H1 - 36px Bold
                          </h1>
                          <code className="text-sm text-unab-gray-500">text-4xl font-bold</code>
                        </div>
                        <div className="p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                          <h2 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">
                            Título H2 - 30px Bold
                          </h2>
                          <code className="text-sm text-unab-gray-500">text-3xl font-bold</code>
                        </div>
                        <div className="p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                          <h3 className="text-2xl font-semibold text-unab-navy dark:text-white mb-2">
                            Título H3 - 24px Semibold
                          </h3>
                          <code className="text-sm text-unab-gray-500">text-2xl font-semibold</code>
                        </div>
                        <div className="p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                          <h4 className="text-xl font-semibold text-unab-navy dark:text-white mb-2">
                            Título H4 - 20px Semibold
                          </h4>
                          <code className="text-sm text-unab-gray-500">text-xl font-semibold</code>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Texto de Cuerpo</h3>
                      <div className="space-y-4">
                        <div className="p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                          <p className="text-base text-unab-gray-800 dark:text-unab-gray-200 mb-2">
                            Texto base - 16px Regular. Este es el texto estándar para contenido principal, descripciones y párrafos largos en el sistema.
                          </p>
                          <code className="text-sm text-unab-gray-500">text-base</code>
                        </div>
                        <div className="p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                          <p className="text-sm text-unab-gray-600 dark:text-unab-gray-400 mb-2">
                            Texto pequeño - 14px Regular. Usado para metadatos, fechas, información secundaria y etiquetas.
                          </p>
                          <code className="text-sm text-unab-gray-500">text-sm</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Componentes */}
            <TabsContent value="components" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Componentes UI
                  </CardTitle>
                  <CardDescription>
                    Biblioteca de componentes del sistema UNAB 3D LAB
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Botones */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Botones</h3>
                    <div className="flex flex-wrap gap-4">
                      <Button>Primario</Button>
                      <Button variant="secondary">Secundario</Button>
                      <Button variant="destructive">Destructivo</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Button size="sm">Pequeño</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Grande</Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Badges</h3>
                    <div className="flex flex-wrap gap-4">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secundario</Badge>
                      <Badge variant="destructive">Destructivo</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>

                  {/* Alertas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Alertas</h3>
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Esta es una alerta informativa para mostrar información general.
                        </AlertDescription>
                      </Alert>
                      <Alert className="border-green-200 dark:border-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          Operación completada exitosamente.
                        </AlertDescription>
                      </Alert>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Ha ocurrido un error que requiere atención.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Tarjetas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Tarjeta Básica</CardTitle>
                          <CardDescription>Descripción de la tarjeta</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-unab-gray-600 dark:text-unab-gray-400">
                            Contenido de la tarjeta con información relevante.
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-unab-red">
                        <CardHeader>
                          <CardTitle className="text-unab-red">Tarjeta Destacada</CardTitle>
                          <CardDescription>Con borde de color UNAB</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge className="mb-2">Importante</Badge>
                          <p className="text-sm text-unab-gray-600 dark:text-unab-gray-400">
                            Tarjeta con elementos destacados.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Progreso</h3>
                    <div className="space-y-4 max-w-md">
                      <Progress value={33} className="w-full" />
                      <Progress value={66} className="w-full" />
                      <Progress value={100} className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Formularios */}
            <TabsContent value="forms" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Elementos de Formulario
                  </CardTitle>
                  <CardDescription>
                    Componentes de entrada y formularios del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Inputs */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Campos de Entrada</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="input-text">Texto</Label>
                          <Input id="input-text" placeholder="Ingresa tu texto aquí" />
                        </div>
                        <div>
                          <Label htmlFor="input-email">Email</Label>
                          <Input id="input-email" type="email" placeholder="usuario@unab.cl" />
                        </div>
                        <div>
                          <Label htmlFor="input-password">Contraseña</Label>
                          <Input id="input-password" type="password" placeholder="••••••••" />
                        </div>
                        <div>
                          <Label htmlFor="textarea">Área de Texto</Label>
                          <Textarea id="textarea" placeholder="Escribe tu mensaje aquí..." />
                        </div>
                      </div>
                    </div>

                    {/* Selects y Controls */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Controles</h3>
                      <div className="space-y-6">
                        <div>
                          <Label>Select</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una opción" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="option1">Opción 1</SelectItem>
                              <SelectItem value="option2">Opción 2</SelectItem>
                              <SelectItem value="option3">Opción 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch id="switch" />
                          <Label htmlFor="switch">Activar notificaciones</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox id="checkbox" />
                          <Label htmlFor="checkbox">Acepto los términos y condiciones</Label>
                        </div>

                        <RadioGroup defaultValue="option1">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option1" id="r1" />
                            <Label htmlFor="r1">Opción 1</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="option2" id="r2" />
                            <Label htmlFor="r2">Opción 2</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Iconografía */}
            <TabsContent value="icons" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Sistema de Iconos
                  </CardTitle>
                  <CardDescription>
                    Iconos utilizados en el sistema UNAB 3D LAB (Lucide React)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Navegación</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { icon: Home, name: "Home" },
                          { icon: BookOpen, name: "BookOpen" },
                          { icon: Users, name: "Users" },
                          { icon: BarChart3, name: "BarChart3" },
                          { icon: Settings, name: "Settings" },
                          { icon: User, name: "User" },
                        ].map(({ icon: Icon, name }) => (
                          <div key={name} className="text-center p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                            <Icon className="h-6 w-6 mx-auto mb-2 text-unab-navy dark:text-white" />
                            <p className="text-xs text-unab-gray-600 dark:text-unab-gray-400">{name}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Acciones</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { icon: Plus, name: "Plus" },
                          { icon: Edit, name: "Edit" },
                          { icon: Trash2, name: "Trash2" },
                          { icon: Copy, name: "Copy" },
                          { icon: Download, name: "Download" },
                          { icon: Upload, name: "Upload" },
                          { icon: Search, name: "Search" },
                          { icon: X, name: "X" },
                        ].map(({ icon: Icon, name }) => (
                          <div key={name} className="text-center p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                            <Icon className="h-6 w-6 mx-auto mb-2 text-unab-navy dark:text-white" />
                            <p className="text-xs text-unab-gray-600 dark:text-unab-gray-400">{name}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-unab-navy dark:text-white">Estados</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                          { icon: CheckCircle, name: "CheckCircle", color: "text-green-600" },
                          { icon: AlertCircle, name: "AlertCircle", color: "text-yellow-600" },
                          { icon: X, name: "Error", color: "text-red-600" },
                          { icon: Info, name: "Info", color: "text-blue-600" },
                        ].map(({ icon: Icon, name, color }) => (
                          <div key={name} className="text-center p-4 border border-unab-gray-200 dark:border-unab-gray-700 rounded-lg">
                            <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
                            <p className="text-xs text-unab-gray-600 dark:text-unab-gray-400">{name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
