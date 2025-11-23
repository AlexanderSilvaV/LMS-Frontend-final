// Tipos para el sistema de experimentos
export interface Experiment {
  id: string
  nombre: string
  descripcion: string
  tipo: "Química" | "Física" | "Biología"
  duracionEstimada: number
  dificultad: "Básico" | "Intermedio" | "Avanzado"
  materiales: string[]
  procedimiento: string[]
  objetivos: string[]
  activo: boolean
  moduloId?: number
  fechaCreacion: string
}

export interface ExperimentResult {
  id: string
  experimentId: string
  estudianteId: string
  estudianteNombre: string
  fechaRealizacion: string
  tiempoTranscurrido: number
  estado: "No Iniciado" | "En Progreso" | "Completado"
  resultados: {
    observaciones: string
    datos: Record<string, any>
    conclusiones: string
  }
  calificacion?: number
  retroalimentacion?: string
}

export interface LabGrade {
  id: string
  experimentId: string
  experimentNombre: string
  estudianteId: string
  calificacion: number
  calificacionMaxima: number
  fecha: string
  criterios: {
    nombre: string
    puntos: number
    puntosMaximos: number
  }[]
  comentarios?: string
}

// Datos simulados
const mockExperiments: Experiment[] = [
  {
    id: "exp-001",
    nombre: "Reacciones Ácido-Base",
    descripcion: "Estudio de las reacciones entre ácidos y bases utilizando indicadores",
    tipo: "Química",
    duracionEstimada: 45,
    dificultad: "Básico",
    materiales: ["HCl 0.1M", "NaOH 0.1M", "Fenolftaleína", "Bureta", "Matraz Erlenmeyer"],
    procedimiento: [
      "Preparar la solución de HCl 0.1M",
      "Añadir indicador fenolftaleína",
      "Titular con NaOH 0.1M",
      "Registrar cambio de color",
    ],
    objetivos: [
      "Comprender el concepto de neutralización",
      "Identificar el punto de equivalencia",
      "Calcular la concentración desconocida",
    ],
    activo: true,
    fechaCreacion: "2024-01-15",
    moduloId: 1,
  },
  {
    id: "exp-002",
    nombre: "Péndulo Simple",
    descripcion: "Análisis del movimiento armónico simple en un péndulo",
    tipo: "Física",
    duracionEstimada: 30,
    dificultad: "Intermedio",
    materiales: ["Péndulo", "Cronómetro", "Regla", "Transportador"],
    procedimiento: [
      "Medir la longitud del péndulo",
      "Establecer ángulo inicial",
      "Medir período de oscilación",
      "Repetir para diferentes longitudes",
    ],
    objetivos: [
      "Verificar la ley del péndulo simple",
      "Calcular la gravedad local",
      "Analizar la independencia del período respecto a la masa",
    ],
    activo: true,
    fechaCreacion: "2024-01-20",
  },
  {
    id: "exp-003",
    nombre: "Observación Celular",
    descripcion: "Estudio de células vegetales y animales bajo microscopio",
    tipo: "Biología",
    duracionEstimada: 60,
    dificultad: "Básico",
    materiales: ["Microscopio", "Portaobjetos", "Cubreobjetos", "Cebolla", "Colorante azul de metileno"],
    procedimiento: [
      "Preparar muestra de cebolla",
      "Aplicar colorante",
      "Observar bajo microscopio",
      "Dibujar estructuras observadas",
    ],
    objetivos: [
      "Identificar estructuras celulares básicas",
      "Comparar células vegetales y animales",
      "Desarrollar habilidades de microscopía",
    ],
    activo: true,
    fechaCreacion: "2024-01-25",
    moduloId: 2,
  },
]

const mockResults: ExperimentResult[] = [
  {
    id: "result-001",
    experimentId: "exp-001",
    estudianteId: "student-001",
    estudianteNombre: "Juan Pérez",
    fechaRealizacion: "2024-02-01",
    tiempoTranscurrido: 42,
    estado: "Completado",
    resultados: {
      observaciones: "Se observó un cambio de color de incoloro a rosa al añadir la base",
      datos: {
        volumenBase: 25.3,
        concentracionCalculada: 0.098,
        pH_inicial: 1.2,
        pH_final: 7.1,
      },
      conclusiones:
        "La neutralización se completó exitosamente. La concentración calculada es muy cercana al valor teórico.",
    },
    calificacion: 85,
    retroalimentacion: "Buen trabajo en la titulación. Considera mejorar la precisión en las mediciones.",
  },
  {
    id: "result-002",
    experimentId: "exp-002",
    estudianteId: "student-001",
    estudianteNombre: "Juan Pérez",
    fechaRealizacion: "2024-02-05",
    tiempoTranscurrido: 28,
    estado: "En Progreso",
    resultados: {
      observaciones: "Mediciones completadas para 3 longitudes diferentes",
      datos: {
        longitud1: 0.5,
        periodo1: 1.42,
        longitud2: 0.8,
        periodo2: 1.79,
      },
      conclusiones: "Pendiente de completar análisis final",
    },
  },
  {
    id: "result-003",
    experimentId: "exp-003",
    estudianteId: "student-001",
    estudianteNombre: "Juan Pérez",
    fechaRealizacion: "2024-02-10",
    tiempoTranscurrido: 55,
    estado: "Completado",
    resultados: {
      observaciones: "Se identificaron claramente núcleo, pared celular y vacuolas en células de cebolla",
      datos: {
        magnificacion: "40x",
        estructurasIdentificadas: ["núcleo", "pared celular", "vacuolas", "citoplasma"],
      },
      conclusiones:
        "Las células vegetales muestran características distintivas como pared celular rígida y vacuolas grandes",
    },
    calificacion: 92,
    retroalimentacion: "Excelente observación y documentación. Los dibujos son muy precisos.",
  },
]

const mockGrades: LabGrade[] = [
  {
    id: "grade-001",
    experimentId: "exp-001",
    experimentNombre: "Reacciones Ácido-Base",
    estudianteId: "student-001",
    calificacion: 85,
    calificacionMaxima: 100,
    fecha: "2024-02-02",
    criterios: [
      { nombre: "Procedimiento", puntos: 18, puntosMaximos: 20 },
      { nombre: "Observaciones", puntos: 15, puntosMaximos: 20 },
      { nombre: "Cálculos", puntos: 17, puntosMaximos: 20 },
      { nombre: "Conclusiones", puntos: 16, puntosMaximos: 20 },
      { nombre: "Seguridad", puntos: 19, puntosMaximos: 20 },
    ],
    comentarios: "Buen dominio de la técnica de titulación. Mejorar precisión en mediciones.",
  },
  {
    id: "grade-002",
    experimentId: "exp-003",
    experimentNombre: "Observación Celular",
    estudianteId: "student-001",
    calificacion: 92,
    calificacionMaxima: 100,
    fecha: "2024-02-11",
    criterios: [
      { nombre: "Preparación de muestras", puntos: 19, puntosMaximos: 20 },
      { nombre: "Uso del microscopio", puntos: 18, puntosMaximos: 20 },
      { nombre: "Identificación de estructuras", puntos: 20, puntosMaximos: 20 },
      { nombre: "Documentación", puntos: 17, puntosMaximos: 20 },
      { nombre: "Análisis", puntos: 18, puntosMaximos: 20 },
    ],
    comentarios: "Trabajo excepcional. Demuestras gran habilidad en microscopía.",
  },
]

// Servicio simulado
export class ExperimentService {
  static async getExperiments(): Promise<Experiment[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockExperiments
  }

  static async getExperimentById(id: string): Promise<Experiment | null> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockExperiments.find((exp) => exp.id === id) || null
  }

  static async getStudentResults(studentId: string): Promise<ExperimentResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return mockResults.filter((result) => result.estudianteId === studentId)
  }

  static async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockResults.filter((result) => result.experimentId === experimentId)
  }

  static async getStudentGrades(studentId: string): Promise<LabGrade[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockGrades.filter((grade) => grade.estudianteId === studentId)
  }

  static async createExperiment(experiment: Omit<Experiment, "id" | "fechaCreacion">): Promise<Experiment> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const newExperiment: Experiment = {
      ...experiment,
      id: `exp-${Date.now()}`,
      fechaCreacion: new Date().toISOString().split("T")[0],
    }
    mockExperiments.push(newExperiment)
    return newExperiment
  }

  static async addExperimentToModule(experimentId: string, moduleId: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const experiment = mockExperiments.find((exp) => exp.id === experimentId)
    if (experiment) {
      experiment.moduloId = moduleId
    }
  }
}
