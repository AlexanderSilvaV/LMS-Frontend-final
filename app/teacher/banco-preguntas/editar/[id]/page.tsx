"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  bancoPreguntasService,
  type BancoPreguntaDTO,
  type BancoPreguntaEdicionDTO,
} from "@/app/lib/banco-preguntas-service"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

const STORAGE_EDIT_KEY = "banco-pregunta-en-edicion"

interface AlternativaLocal {
  id: string
  texto: string
  esCorrecta: boolean
}

const crearAlternativaDesdeDto = (texto: string, esCorrecta: boolean, index: number): AlternativaLocal => ({
  id: `${Date.now()}-${index}-${crypto.randomUUID()}`,
  texto,
  esCorrecta,
})

export default function EditarPreguntaPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const preguntaId = Number(params.id)

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [pregunta, setPregunta] = useState<BancoPreguntaDTO | null>(null)

  const [enunciado, setEnunciado] = useState("")
  const [categoria, setCategoria] = useState<string | null>(null)
  const [puntos, setPuntos] = useState(1)
  const [activa, setActiva] = useState(true)
  const [alternativas, setAlternativas] = useState<AlternativaLocal[]>([])

  const cargarPregunta = async () => {
    setCargando(true)
    try {
      let data: BancoPreguntaDTO | null = null

      if (typeof window !== "undefined") {
        const raw = sessionStorage.getItem(STORAGE_EDIT_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as BancoPreguntaDTO
          if (parsed?.id === preguntaId) {
            data = parsed
          }
          sessionStorage.removeItem(STORAGE_EDIT_KEY)
        }
      }

      if (!data) {
        const respuesta = await bancoPreguntasService.listarPreguntas({
          numeroPagina: 1,
          tamanoPagina: 200,
        })
        data = respuesta.preguntas.find((item) => item.id === preguntaId) || null
      }

      if (!data) {
        toast({
          title: "Pregunta no encontrada",
          description: "No se pudo cargar la información solicitada",
          variant: "destructive",
        })
        router.push("/teacher/banco-preguntas")
        return
      }

      setPregunta(data)
      setEnunciado(data.enunciado)
      setCategoria(data.categoria ?? null)
      setPuntos(data.puntos)
      setActiva(data.activa)
      setAlternativas(
        data.opciones.map((opcion, index) => crearAlternativaDesdeDto(opcion.texto, opcion.esCorrecta, index)),
      )
    } catch (err) {
      console.error("Error cargando pregunta", err)
      toast({
        title: "No se pudo cargar la pregunta",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
      router.push("/teacher/banco-preguntas")
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (Number.isFinite(preguntaId)) {
      void cargarPregunta()
    } else {
      toast({ title: "Identificador de pregunta inválido", variant: "destructive" })
      router.push("/teacher/banco-preguntas")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntaId])

  const setCorrecta = (id: string) => {
    setAlternativas((prev) => prev.map((opcion) => ({ ...opcion, esCorrecta: opcion.id === id })))
  }

  const agregarAlternativa = () => {
    setAlternativas((prev) => [...prev, crearAlternativaDesdeDto("", false, prev.length)])
  }

  const eliminarAlternativa = (id: string) => {
    setAlternativas((prev) => (prev.length <= 2 ? prev : prev.filter((opcion) => opcion.id !== id)))
  }

  const actualizarTexto = (id: string, texto: string) => {
    setAlternativas((prev) => prev.map((opcion) => (opcion.id === id ? { ...opcion, texto } : opcion)))
  }

  const formularioValido = useMemo(() => {
    if (!enunciado.trim()) return false
    if (alternativas.length < 2) return false
    if (alternativas.some((opcion) => !opcion.texto.trim())) return false
    if (!alternativas.some((opcion) => opcion.esCorrecta)) return false
    return true
  }, [alternativas, enunciado])

  const guardarCambios = async () => {
    if (!formularioValido || !pregunta) {
      toast({ title: "Completa todos los campos requeridos", variant: "destructive" })
      return
    }

    setGuardando(true)
    const dto: BancoPreguntaEdicionDTO = {
      enunciado: enunciado.trim(),
      categoria: categoria?.trim() || null,
      puntos,
      activa,
      opciones: alternativas.map((opcion, index) => ({
        texto: opcion.texto.trim(),
        esCorrecta: opcion.esCorrecta,
        orden: index + 1,
      })),
    }

    try {
      await bancoPreguntasService.actualizarPregunta(pregunta.id, dto)
      toast({ title: "Pregunta actualizada" })
      router.push("/teacher/banco-preguntas")
    } catch (err) {
      console.error("Error actualizando pregunta", err)
      toast({
        title: "No se pudo actualizar la pregunta",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <div className="p-6">Cargando pregunta…</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar pregunta</h1>
          <p className="text-sm text-muted-foreground">Modifica el contenido y las opciones disponibles.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <textarea
          className="md:col-span-2 h-40 rounded border p-3"
          value={enunciado}
          onChange={(event) => setEnunciado(event.target.value)}
        />

        <input
          className="rounded border p-2"
          placeholder="Categoría (opcional)"
          value={categoria ?? ""}
          onChange={(event) => setCategoria(event.target.value || null)}
        />

        <div className="flex items-center gap-3">
          <label className="text-sm">Puntos</label>
          <input
            type="number"
            min={1}
            max={100}
            className="w-24 rounded border p-2"
            value={puntos}
            onChange={(event) => setPuntos(Number(event.target.value) || 1)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activa}
            onChange={(event) => setActiva(event.target.checked)}
          />
          Pregunta activa
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Alternativas</h2>
          <Button variant="outline" size="sm" onClick={agregarAlternativa}>
            Agregar alternativa
          </Button>
        </div>

        {alternativas.map((alternativa, index) => (
          <div key={alternativa.id} className="flex flex-col gap-2 rounded border p-3 md:flex-row md:items-center">
            <label className="flex items-center gap-2 text-sm md:w-40">
              <input
                type="radio"
                name="correcta"
                checked={alternativa.esCorrecta}
                onChange={() => setCorrecta(alternativa.id)}
              />
              Correcta
            </label>
            <input
              className="flex-1 rounded border p-2"
              placeholder={`Alternativa ${index + 1}`}
              value={alternativa.texto}
              onChange={(event) => actualizarTexto(alternativa.id, event.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => eliminarAlternativa(alternativa.id)}
              disabled={alternativas.length <= 2}
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/teacher/banco-preguntas")}>
          Cancelar
        </Button>
        <Button onClick={guardarCambios} disabled={!formularioValido || guardando}>
          {guardando ? "Guardando..." : "Actualizar"}
        </Button>
      </div>
    </div>
  )
}
