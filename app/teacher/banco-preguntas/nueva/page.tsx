"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { bancoPreguntasService } from "@/app/lib/banco-preguntas-service"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface AlternativaLocal {
  id: string
  texto: string
  esCorrecta: boolean
}

const crearAlternativa = (index: number): AlternativaLocal => ({
  id: `${Date.now()}-${index}-${crypto.randomUUID()}`,
  texto: "",
  esCorrecta: index === 0,
})

export default function NuevaPreguntaPage() {
  const router = useRouter()

  const [enunciado, setEnunciado] = useState("")
  const [categoria, setCategoria] = useState("")
  const [puntos, setPuntos] = useState(1)
  const [activa, setActiva] = useState(true)
  const [alternativas, setAlternativas] = useState<AlternativaLocal[]>([
    crearAlternativa(0),
    crearAlternativa(1),
  ])
  const [guardando, setGuardando] = useState(false)

  const setCorrecta = (id: string) => {
    setAlternativas((prev) => prev.map((opcion) => ({ ...opcion, esCorrecta: opcion.id === id })))
  }

  const agregarAlternativa = () => {
    setAlternativas((prev) => [...prev, crearAlternativa(prev.length)])
  }

  const eliminarAlternativa = (id: string) => {
    setAlternativas((prev) => (prev.length <= 2 ? prev : prev.filter((opcion) => opcion.id !== id)))
  }

  const actualizarTextoAlternativa = (id: string, texto: string) => {
    setAlternativas((prev) => prev.map((opcion) => (opcion.id === id ? { ...opcion, texto } : opcion)))
  }

  const validarFormulario = () => {
    if (!enunciado.trim()) {
      toast({
        title: "El enunciado es obligatorio",
        variant: "destructive",
      })
      return false
    }

    if (alternativas.some((opcion) => !opcion.texto.trim())) {
      toast({
        title: "Completa el texto de todas las alternativas",
        variant: "destructive",
      })
      return false
    }

    if (!alternativas.some((opcion) => opcion.esCorrecta)) {
      toast({
        title: "Selecciona una alternativa correcta",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const guardarPregunta = async () => {
    if (!validarFormulario()) return

    setGuardando(true)
    try {
      await bancoPreguntasService.crearPregunta({
        enunciado: enunciado.trim(),
        categoria: categoria.trim() || null,
        puntos,
        activa,
        opciones: alternativas.map((opcion, index) => ({
          texto: opcion.texto.trim(),
          esCorrecta: opcion.esCorrecta,
          orden: index + 1,
        })),
      })

      toast({ title: "Pregunta creada correctamente" })
      router.push("/teacher/banco-preguntas")
    } catch (err) {
      console.error("Error guardando pregunta", err)
      toast({
        title: "No se pudo guardar la pregunta",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nueva pregunta</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Volver
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <textarea
          className="md:col-span-2 h-40 rounded border p-3"
          placeholder="Ingresa el enunciado de la pregunta"
          value={enunciado}
          onChange={(event) => setEnunciado(event.target.value)}
        />

        <input
          className="rounded border p-2"
          placeholder="Categoría (opcional)"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
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
              onChange={(event) => actualizarTextoAlternativa(alternativa.id, event.target.value)}
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
        <Button onClick={guardarPregunta} disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  )
}
