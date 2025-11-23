export type DificultadBanco = "Baja" | "Media" | "Alta"

export interface OpcionBancoDTO {
  id?: number
  texto: string
  esCorrecta: boolean
  orden: number
  bancoPreguntaId?: number
}

export interface BancoPreguntaDTO {
  id: number
  enunciado: string
  categoria?: string | null
  docenteId?: string
  fechaCreacion: string
  fechaModificacion?: string | null
  puntos: number
  activa: boolean
  opciones: OpcionBancoDTO[]
}

export interface BancoPreguntaCreacionDTO {
  enunciado: string
  categoria?: string | null
  puntos: number
  activa?: boolean
  opciones: Array<Omit<OpcionBancoDTO, "id" | "bancoPreguntaId">>
}

export type BancoPreguntaEdicionDTO = BancoPreguntaCreacionDTO

export interface PaginacionRespuesta {
  paginaActual: number
  cantidadPorPagina: number
  totalResultados: number
  totalPaginas: number
}

export interface BancoPreguntasListadoRespuesta {
  preguntas: BancoPreguntaDTO[]
  paginacion: PaginacionRespuesta
}

class BancoPreguntasService {
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      throw new Error("No se encontró el token de autenticación")
    }

    const headers = new Headers(options.headers || {})
    headers.set("Authorization", `Bearer ${token}`)

    const isFormData = typeof FormData !== "undefined" && (options.body instanceof FormData || options.body instanceof URLSearchParams)
    if (!isFormData && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    const response = await fetch(path, {
      ...options,
      headers,
    })

    const responseText = await response.text()

    if (!response.ok) {
      let mensaje = `Error ${response.status}`
      try {
        const data = responseText ? JSON.parse(responseText) : {}
        mensaje = data.mensaje || data.Message || mensaje
      } catch {
        mensaje = responseText || mensaje
      }
      throw new Error(mensaje)
    }

    if (!responseText) {
      return {} as T
    }

    return JSON.parse(responseText) as T
  }

  async listarPreguntas(params: {
    numeroPagina?: number
    tamanoPagina?: number
    categoria?: string | null
  } = {}): Promise<BancoPreguntasListadoRespuesta> {
    const searchParams = new URLSearchParams()
    if (params.numeroPagina) searchParams.set("numeroPagina", params.numeroPagina.toString())
    if (params.tamanoPagina) searchParams.set("tamanoPagina", params.tamanoPagina.toString())
    if (params.categoria) searchParams.set("categoria", params.categoria)

    const queryString = searchParams.toString()
    const url = `/api/banco-preguntas${queryString ? `?${queryString}` : ""}`
    return this.request<BancoPreguntasListadoRespuesta>(url, { method: "GET" })
  }

  async crearPregunta(dto: BancoPreguntaCreacionDTO) {
    return this.request(`/api/banco-preguntas`, {
      method: "POST",
      body: JSON.stringify(dto),
    })
  }

  async actualizarPregunta(id: number, dto: BancoPreguntaEdicionDTO) {
    return this.request(`/api/banco-preguntas/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    })
  }

  async eliminarPregunta(id: number) {
    return this.request(`/api/banco-preguntas/${id}`, {
      method: "DELETE",
    })
  }

  async obtenerCategorias(): Promise<string[]> {
    const respuesta = await this.request<{ categorias: string[] }>(`/api/banco-preguntas/categorias`, {
      method: "GET",
    })
    return respuesta.categorias || []
  }

  async crearCategoria(nombre: string) {
    return this.request(`/api/banco-preguntas/categorias`, {
      method: "POST",
      body: JSON.stringify({ nombre }),
    })
  }

  async importarDesdeExcel(archivo: File) {
    const formData = new FormData()
    formData.append("archivo", archivo)

    return this.request(`/api/banco-preguntas/importar`, {
      method: "POST",
      body: formData,
    })
  }
}

export const bancoPreguntasService = new BancoPreguntasService()
