"use client"

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  bancoPreguntasService,
  type BancoPreguntaDTO,
  type BancoPreguntaCreacionDTO,
} from "@/app/lib/banco-preguntas-service"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Trash2, Pencil, Eye, FileSpreadsheet } from "lucide-react"

const PAGE_SIZE = 10
const STORAGE_EDIT_KEY = "banco-pregunta-en-edicion"

export default function BancoPreguntasPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preguntas, setPreguntas] = useState<BancoPreguntaDTO[]>([])
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [importando, setImportando] = useState(false)

  useEffect(() => {
    cargarCategorias()
  }, [])

  useEffect(() => {
    cargarPreguntas(1, categoriaFiltro || undefined)
  }, [categoriaFiltro])

  const cargarCategorias = async () => {
    setLoadingCategorias(true)
    try {
      const data = await bancoPreguntasService.obtenerCategorias()
      setCategorias(data)
    } catch (err) {
      console.error("Error cargando categorías", err)
      toast({
        title: "No se pudieron cargar las categorías",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoadingCategorias(false)
    }
  }

  const cargarPreguntas = async (pagina = 1, categoria?: string) => {
    setLoading(true)
    setError(null)
    try {
      const respuesta = await bancoPreguntasService.listarPreguntas({
        numeroPagina: pagina,
        tamanoPagina: PAGE_SIZE,
        categoria,
      })

      setPreguntas(respuesta.preguntas)
      setPaginaActual(respuesta.paginacion.paginaActual)
      setTotalPaginas(respuesta.paginacion.totalPaginas || 1)
      setSelectedIds([])
    } catch (err) {
      console.error("Error cargando preguntas", err)
      const message = err instanceof Error ? err.message : "Error desconocido"
      setError(message)
      setPreguntas([])
      toast({
        title: "No se pudieron cargar las preguntas",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const preguntasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) {
      return preguntas
    }
    const term = searchTerm.trim().toLowerCase()
    return preguntas.filter((pregunta) => {
      const categoria = pregunta.categoria || ""
      return (
        pregunta.enunciado.toLowerCase().includes(term) ||
        categoria.toLowerCase().includes(term)
      )
    })
  }, [preguntas, searchTerm])

  const allSelected = preguntasFiltradas.length > 0 && selectedIds.length === preguntasFiltradas.length

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(preguntasFiltradas.map((p) => p.id))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const confirmarEliminar = async (ids: number[]) => {
    if (ids.length === 0) return
    const confirmado = window.confirm(`¿Eliminar ${ids.length} pregunta(s) del banco?`)
    if (!confirmado) return

    try {
      for (const id of ids) {
        await bancoPreguntasService.eliminarPregunta(id)
      }
      toast({ title: "Preguntas eliminadas", description: "Se actualizará el listado." })
      await cargarPreguntas(paginaActual, categoriaFiltro || undefined)
    } catch (err) {
      console.error("Error eliminando preguntas", err)
      toast({
        title: "No se pudieron eliminar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    }
  }

  const duplicarPregunta = async (pregunta: BancoPreguntaDTO) => {
    const dto: BancoPreguntaCreacionDTO = {
      enunciado: `${pregunta.enunciado} (copia)`
        .replace(/\s+\(copia\)$/i, " (copia)"),
      categoria: pregunta.categoria,
      puntos: pregunta.puntos,
      activa: pregunta.activa,
      opciones: pregunta.opciones.map((opcion, index) => ({
        texto: opcion.texto,
        esCorrecta: opcion.esCorrecta,
        orden: index + 1,
      })),
    }

    try {
      await bancoPreguntasService.crearPregunta(dto)
      toast({ title: "Pregunta duplicada" })
      await cargarPreguntas(paginaActual, categoriaFiltro || undefined)
    } catch (err) {
      console.error("Error duplicando pregunta", err)
      toast({
        title: "No se pudo duplicar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    }
  }

  const verDetalle = (pregunta: BancoPreguntaDTO) => {
    const opciones = pregunta.opciones
      .map((opcion) => `- ${opcion.esCorrecta ? "✅" : "○"} ${opcion.texto}`)
      .join("\n")

    window.alert(
      `ENUNCIADO\n${pregunta.enunciado}\n\nCATEGORÍA: ${pregunta.categoria || "Sin categoría"}\nPUNTOS: ${
        pregunta.puntos
      }\nESTADO: ${pregunta.activa ? "Activa" : "Inactiva"}\nCREADA: ${new Date(
        pregunta.fechaCreacion,
      ).toLocaleString()}\n\nOPCIONES:\n${opciones}`,
    )
  }

  const irAEditar = (pregunta: BancoPreguntaDTO) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_EDIT_KEY, JSON.stringify(pregunta))
    }
    router.push(`/teacher/banco-preguntas/editar/${pregunta.id}`)
  }

  const seleccionarArchivo = () => {
    fileInputRef.current?.click()
  }

  const manejarImportacion = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setImportando(true)
    try {
      await bancoPreguntasService.importarDesdeExcel(file)
      toast({ title: "Importación en proceso", description: "Refrescando preguntas" })
      await cargarPreguntas(1, categoriaFiltro || undefined)
    } catch (err) {
      console.error("Error importando preguntas", err)
      toast({
        title: "No se pudo importar",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setImportando(false)
    }
  }

  const recargar = () => {
    cargarPreguntas(paginaActual, categoriaFiltro || undefined)
    if (!categorias.length) {
      cargarCategorias()
    }
  }

  return (
    <div className="p-6 space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={manejarImportacion}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Banco de Preguntas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tu biblioteca personal e importa preguntas desde Excel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={recargar} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            Refrescar
          </Button>
          <Button variant="outline" onClick={seleccionarArchivo} disabled={importando}>
            {importando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Importar Excel
          </Button>
          <Link href="/teacher/banco-preguntas/nueva">
            <Button>Crear pregunta</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border p-4 shadow-sm md:grid-cols-5">
        <input
          className="border rounded p-2 md:col-span-2"
          placeholder="Buscar por enunciado o categoría"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          className="border rounded p-2"
          value={categoriaFiltro}
          onChange={(event) => setCategoriaFiltro(event.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>

        <div className="flex items-center text-sm text-muted-foreground md:col-span-2">
          {loadingCategorias ? "Cargando categorías…" : `${categorias.length} categorías disponibles`}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {error ? error : `Página ${paginaActual} de ${totalPaginas}`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            disabled={selectedIds.length === 0}
            onClick={() => confirmarEliminar(selectedIds)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar seleccionadas
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="border p-3 text-center">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <th className="border p-3 text-left">Enunciado</th>
              <th className="border p-3 text-center">Categoría</th>
              <th className="border p-3 text-center">Puntos</th>
              <th className="border p-3 text-center">Estado</th>
              <th className="border p-3 text-center">Creación</th>
              <th className="border p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando preguntas…
                  </div>
                </td>
              </tr>
            ) : preguntasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "Sin resultados para la búsqueda" : "No hay preguntas registradas"}
                </td>
              </tr>
            ) : (
              preguntasFiltradas.map((pregunta) => (
                <tr key={pregunta.id} className="hover:bg-muted/40">
                  <td className="border p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(pregunta.id)}
                      onChange={() => toggleOne(pregunta.id)}
                    />
                  </td>
                  <td className="border p-3">
                    <div className="font-medium line-clamp-2">{pregunta.enunciado}</div>
                    <button
                      className="mt-1 text-xs text-primary hover:underline"
                      onClick={() => verDetalle(pregunta)}
                    >
                      Ver detalle
                    </button>
                  </td>
                  <td className="border p-3 text-center">{pregunta.categoria || "—"}</td>
                  <td className="border p-3 text-center">{pregunta.puntos}</td>
                  <td className="border p-3 text-center">
                    <span className={pregunta.activa ? "text-green-600" : "text-muted-foreground"}>
                      {pregunta.activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="border p-3 text-center">
                    {new Date(pregunta.fechaCreacion).toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => verDetalle(pregunta)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => irAEditar(pregunta)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => duplicarPregunta(pregunta)}>
                        Duplicar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => confirmarEliminar([pregunta.id])}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          disabled={paginaActual <= 1 || loading}
          onClick={() => cargarPreguntas(Math.max(1, paginaActual - 1), categoriaFiltro || undefined)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {paginaActual} de {totalPaginas}
        </span>
        <Button
          variant="outline"
          disabled={paginaActual >= totalPaginas || loading}
          onClick={() => cargarPreguntas(Math.min(totalPaginas, paginaActual + 1), categoriaFiltro || undefined)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
