"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  GraduationCap,
  UserCheck,
  RefreshCw,
  AlertCircle,
  Key,
} from "lucide-react"
import { backendService } from "@/app/lib/backend-service"
import isRutValido from "@/app/lib/validador-rut"

interface User {
  id: string
  nombre: string
  correo: string
  rut: string
  rol: string
  fechaCreacion: string
}

interface CreateUserData {
  nombre: string
  correo: string
  rut: string
  Contraseña: string 
  rol: string
}

interface EditUserData {
  nombre: string
  correo: string
  rol: string
}

interface ChangePasswordData {
  nuevaPassword: string
  confirmarPassword: string
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const usersPerPage = 10

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Form states
  const [createUserData, setCreateUserData] = useState<CreateUserData>({
    nombre: "",
    correo: "",
    rut: "",
    Contraseña: "",
    rol: "Alumno",
  })
  const [editUserData, setEditUserData] = useState<EditUserData>({
    nombre: "",
    correo: "",
    rol: "",
  })
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    nuevaPassword: "",
    confirmarPassword: "",
  })

  // Messages
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("userRole")

    if (!token) {
      router.push("/")
      return
    }

    if (userRole !== "Administrador") {
      router.push("/")
      return
    }

    loadUsers()
  }, [router, currentPage, searchTerm, roleFilter])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("")
        setError("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token") || ""
      const response = await backendService.getUsers(
        {
          paginaActual: currentPage,
          cantidadPorPagina: usersPerPage,
          nombre: searchTerm,
          rol: roleFilter === "all" ? undefined : roleFilter,
        },
        token
      )

  setUsers(response.usuarios || [])
  setTotalPages(response.paginacion?.totalPaginas || response.paginacion?.totalPaginas || 1)
  setTotalUsers(response.paginacion?.totalResultados ?? (response.usuarios ? response.usuarios.length : 0))
    } catch (error) {
      console.error("Error loading users:", error)
      setError("Error al cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    setSuccess("")

    // Validar RUT en frontend usando la misma lógica que el backend
    if (!isRutValido(createUserData.rut)) {
      setError("RUT inválido. Verifica el formato y dígito verificador.")
      setCreating(false)
      return
    }

    try {
      const token = localStorage.getItem("token") || ""
      await backendService.createUser(createUserData, token)
      setSuccess("Usuario creado exitosamente")
      setShowCreateDialog(false)
      setCreateUserData({
        nombre: "",
        correo: "",
        rut: "",
        Contraseña: "",
        rol: "Alumno",
      })
      loadUsers()
    } catch (error) {
      console.error("Error creating user:", error)
      setError(error instanceof Error ? error.message : "Error al crear usuario")
    } finally {
      setCreating(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setEditing(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token") || ""
      await backendService.updateUser(currentUser.id, editUserData, token)
      setSuccess("Usuario actualizado exitosamente")
      setShowEditDialog(false)
      setCurrentUser(null)
      loadUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      setError(error instanceof Error ? error.message : "Error al actualizar usuario")
    } finally {
      setEditing(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (passwordData.nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setChangingPassword(true)
    setError("")
    setSuccess("")

    try {
      await backendService.changeUserPassword(currentUser.id, passwordData.nuevaPassword)
      setSuccess("Contraseña cambiada exitosamente")
      setShowPasswordDialog(false)
      setCurrentUser(null)
      setPasswordData({
        nuevaPassword: "",
        confirmarPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      setError(error instanceof Error ? error.message : "Error al cambiar contraseña")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return

    try {
      const token = localStorage.getItem("token") || ""
      await backendService.deleteUser(userId, token)
      setSuccess("Usuario eliminado exitosamente")
      loadUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      setError(error instanceof Error ? error.message : "Error al eliminar usuario")
    }
  }

  const openEditDialog = (user: User) => {
    setCurrentUser(user)
    setEditUserData({
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    })
    setShowEditDialog(true)
  }

  const openPasswordDialog = (user: User) => {
    setCurrentUser(user)
    setPasswordData({
      nuevaPassword: "",
      confirmarPassword: "",
    })
    setShowPasswordDialog(true)
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "Administrador":
        return {
          label: "Admin",
          icon: Shield,
          color: "text-unab-red dark:text-unab-red-light",
          bgColor: "bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800",
        }
      case "Docente":
        return {
          label: "Docente",
          icon: GraduationCap,
          color: "text-unab-navy dark:text-unab-navy-light",
          bgColor: "bg-unab-navy/10 dark:bg-unab-navy/10 border border-unab-navy/20 dark:border-unab-navy/30",
        }
      case "Alumno":
      default:
        return {
          label: "Estudiante",
          icon: UserCheck,
          color: "text-unab-red dark:text-unab-red-light",
          bgColor: "bg-unab-red/10 dark:bg-unab-red/10 border border-unab-red/20 dark:border-unab-red/30",
        }
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rut.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.rol === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="flex h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="admin" />

      <div className="flex-1 lg:ml-64 overflow-y-auto">
        <main className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-unab-navy dark:text-white mb-2">Gestión de Usuarios</h1>
              <p className="text-unab-gray-600 dark:text-white">
                Administra todos los usuarios del sistema ({totalUsers} usuarios registrados)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadUsers} disabled={loading} className="border-unab-gray-300 hover:bg-unab-gray-50 dark:border-unab-navy-light dark:hover:bg-unab-navy">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-unab-red hover:bg-unab-red-dark text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                      Completa la información para crear un nuevo usuario en el sistema.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="nombre" className="text-right">
                          Nombre *
                        </Label>
                        <Input
                          id="nombre"
                          value={createUserData.nombre}
                          onChange={(e) => setCreateUserData({ ...createUserData, nombre: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="correo" className="text-right">
                          Correo *
                        </Label>
                        <Input
                          id="correo"
                          type="email"
                          value={createUserData.correo}
                          onChange={(e) => setCreateUserData({ ...createUserData, correo: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rut" className="text-right">
                          RUT *
                        </Label>
                        <Input
                          id="rut"
                          value={createUserData.rut}
                          onChange={(e) => setCreateUserData({ ...createUserData, rut: e.target.value })}
                          className="col-span-3"
                          placeholder="12345678-9"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Contraseña *
                        </Label>
                        <Input
                          id="Contraseña"
                          type="password"
                          value={createUserData.Contraseña}
                          onChange={(e) => setCreateUserData({ ...createUserData, Contraseña: e.target.value })}
                          className="col-span-3"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rol" className="text-right">
                          Rol *
                        </Label>
                        <Select
                          value={createUserData.rol}
                          onValueChange={(value) => setCreateUserData({ ...createUserData, rol: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alumno">Estudiante</SelectItem>
                            <SelectItem value="Docente">Docente</SelectItem>
                            <SelectItem value="Administrador">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button type="submit" disabled={creating}>
                        {creating ? "Creando..." : "Crear Usuario"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por nombre, correo o RUT..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="Alumno">Estudiantes</SelectItem>
                      <SelectItem value="Docente">Docentes</SelectItem>
                      <SelectItem value="Administrador">Administradores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Lista de Usuarios</span>
              </CardTitle>
              <CardDescription>
                {loading ? "Cargando usuarios..." : `Mostrando ${filteredUsers.length} de ${totalUsers} usuarios`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Fecha Registro</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-unab-gray-600 dark:text-white">
                              {searchTerm || roleFilter !== "all"
                                ? "No se encontraron usuarios con los filtros aplicados"
                                : "No hay usuarios registrados"}
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => {
                          const roleInfo = getRoleInfo(user.rol)
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.nombre}</TableCell>
                              <TableCell>{user.correo}</TableCell>
                              <TableCell className="font-mono text-sm">{user.rut}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${roleInfo.bgColor} ${roleInfo.color} border-current`}
                                >
                                  <roleInfo.icon className="h-3 w-3 mr-1" />
                                  {roleInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-unab-gray-600 dark:text-white">
                                {new Date(user.fechaCreacion).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}/profile`)}>
                                      <UserCheck className="h-4 w-4 mr-2" />
                                      Ver Perfil
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openPasswordDialog(user)}>
                                      <Key className="h-4 w-4 mr-2" />
                                      Cambiar Contraseña
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-unab-red dark:text-unab-red-light"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-unab-gray-600 dark:text-white">
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Usuario</DialogTitle>
                <DialogDescription>Modifica la información del usuario seleccionado.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditUser}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-nombre" className="text-right">
                      Nombre *
                    </Label>
                    <Input
                      id="edit-nombre"
                      value={editUserData.nombre}
                      onChange={(e) => setEditUserData({ ...editUserData, nombre: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-correo" className="text-right">
                      Correo *
                    </Label>
                    <Input
                      id="edit-correo"
                      type="email"
                      value={editUserData.correo}
                      onChange={(e) => setEditUserData({ ...editUserData, correo: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-rol" className="text-right">
                      Rol *
                    </Label>
                    <Select
                      value={editUserData.rol}
                      onValueChange={(value) => setEditUserData({ ...editUserData, rol: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alumno">Estudiante</SelectItem>
                        <SelectItem value="Docente">Docente</SelectItem>
                        <SelectItem value="Administrador">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currentUser && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">RUT</Label>
                      <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {currentUser.rut}
                      </div>
                    </div>
                  )}
                </div>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={editing}>
                    {editing ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Change Password Dialog */}
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <DialogDescription>Establece una nueva contraseña para {currentUser?.nombre}.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleChangePassword}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nueva-password" className="text-right">
                      Nueva Contraseña *
                    </Label>
                    <Input
                      id="nueva-password"
                      type="password"
                      value={passwordData.nuevaPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, nuevaPassword: e.target.value })}
                      className="col-span-3"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirmar-password" className="text-right">
                      Confirmar Contraseña *
                    </Label>
                    <Input
                      id="confirmar-password"
                      type="password"
                      value={passwordData.confirmarPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmarPassword: e.target.value })}
                      className="col-span-3"
                      required
                      minLength={6}
                      placeholder="Repetir contraseña"
                    />
                  </div>
                </div>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
