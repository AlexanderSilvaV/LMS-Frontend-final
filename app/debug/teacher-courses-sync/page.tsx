"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Course {
  nrc: number
  nombre: string
  descripcion: string
  activo: boolean
  rolEnCurso?: string
}

export default function TeacherCoursesSyncDebug() {
  const [dashboardCourses, setDashboardCourses] = useState<Course[]>([])
  const [pagesCourses, setPagesCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDashboardMethod = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      console.log("🔍 [DASHBOARD-METHOD] Fetching courses...")

      const response = await fetch("/api/courses/assigned", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📚 [DASHBOARD-METHOD] Response:", data)
        setDashboardCourses(data.dato || [])
      } else {
        console.error("❌ [DASHBOARD-METHOD] Error:", response.status)
      }
    } catch (error) {
      console.error("❌ [DASHBOARD-METHOD] Exception:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPagesMethod = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")

      console.log("🔍 [PAGES-METHOD] Fetching courses...")

      const response = await fetch("/api/courses/assigned", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📚 [PAGES-METHOD] Response:", data)

        let coursesData: Course[] = []
        if (data.operacionExitosa || data.exito) {
          coursesData = data.dato || []
        } else if (Array.isArray(data)) {
          coursesData = data
        } else if (data.cursos) {
          coursesData = data.cursos
        } else {
          coursesData = []
        }

        const teacherCourses = coursesData.filter(
          (course) => course.rolEnCurso === "Docente" || course.rolEnCurso === "Profesor",
        )

        setPagesCourses(teacherCourses)
      } else {
        console.error("❌ [PAGES-METHOD] Error:", response.status)
      }
    } catch (error) {
      console.error("❌ [PAGES-METHOD] Exception:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Debug: Teacher Courses Sync</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Método Dashboard</CardTitle>
            <Button onClick={fetchDashboardMethod} disabled={loading}>
              Probar Método Dashboard
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Cursos encontrados: {dashboardCourses.length}</p>
            <div className="space-y-2">
              {dashboardCourses.map((course) => (
                <div key={course.nrc} className="p-2 border rounded">
                  <div className="font-semibold">{course.nombre}</div>
                  <div className="text-sm text-gray-600">NRC: {course.nrc}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={course.activo ? "default" : "secondary"}>
                      {course.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {course.rolEnCurso && <Badge variant="outline">{course.rolEnCurso}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Método Pages</CardTitle>
            <Button onClick={fetchPagesMethod} disabled={loading}>
              Probar Método Pages
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Cursos encontrados: {pagesCourses.length}</p>
            <div className="space-y-2">
              {pagesCourses.map((course) => (
                <div key={course.nrc} className="p-2 border rounded">
                  <div className="font-semibold">{course.nombre}</div>
                  <div className="text-sm text-gray-600">NRC: {course.nrc}</div>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={course.activo ? "default" : "secondary"}>
                      {course.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {course.rolEnCurso && <Badge variant="outline">{course.rolEnCurso}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Dashboard: {dashboardCourses.length} cursos</p>
            <p>Pages: {pagesCourses.length} cursos</p>
            <p>¿Son iguales?: {dashboardCourses.length === pagesCourses.length ? "✅ Sí" : "❌ No"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
