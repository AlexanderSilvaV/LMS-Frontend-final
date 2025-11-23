// Servicio para manejo de evaluaciones
import { 
  EvaluacionDTO, 
  EvaluacionCreacionDTO,
  EvaluacionEdicionDTO,
  EvaluacionEstudianteDTO,
  IniciarEvaluacionDTO,
  SubmitEvaluacionDTO,
  ResultadoEvaluacionDTO
} from '@/DTOs/EvaluacionDTOs';

export class EvaluacionService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5253";
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Métodos para docentes - AJUSTADOS a las rutas reales del backend
  async crearEvaluacion(evaluacion: EvaluacionCreacionDTO): Promise<EvaluacionDTO> {
    console.log('🚀 INICIANDO CREACIÓN DE EVALUACIÓN');
    console.log('📝 Datos originales:', evaluacion);
    
    const esLaboratorio = evaluacion.esLaboratorio3DLab === true;
    const tiempoLimite = esLaboratorio ? 0 : evaluacion.tiempoLimiteMins;
    const intentosMaximos = esLaboratorio ? 0 : evaluacion.intentosMaximos;
    const fechaInicioIso = esLaboratorio || !evaluacion.fechaInicio ? null : new Date(evaluacion.fechaInicio).toISOString();
    const fechaFinIso = esLaboratorio || !evaluacion.fechaFin ? null : new Date(evaluacion.fechaFin).toISOString();

    // Transformar a PascalCase para el backend

    const evaluacionBackend = {
      Titulo: evaluacion.titulo,
      Descripcion: evaluacion.descripcion,
      CursoId: evaluacion.cursoId,
      FechaInicio: fechaInicioIso,
      FechaFin: fechaFinIso,
      TiempoLimiteMins: tiempoLimite,
      IntentosMaximos: intentosMaximos,
      EsLaboratorio3DLab: evaluacion.esLaboratorio3DLab,
      PreguntasMinimasLaboratorio: evaluacion.preguntasMinimasLaboratorio,
      PreguntasPorSesionLaboratorio: evaluacion.preguntasPorSesionLaboratorio,
      Preguntas: evaluacion.preguntas.map(pregunta => ({
        Texto: pregunta.texto,
        Puntos: pregunta.puntos,
        Orden: pregunta.orden,
        Opciones: pregunta.opciones.map(opcion => ({
          Texto: opcion.texto,
          EsCorrecta: opcion.esCorrecta,
          Orden: opcion.orden
        }))
      }))
    };
    
    console.log('📤 Enviando datos transformados al backend:', evaluacionBackend);
    console.log('🌐 URL:', `${this.baseUrl}/api/Evaluacion`);
    
    const response = await fetch(`${this.baseUrl}/api/Evaluacion`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(evaluacionBackend),
    });

    console.log('📥 Respuesta del servidor:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error del servidor:', error);
      throw new Error(`Error al crear evaluación: ${error}`);
    }

    const resultado = await response.json();
    console.log('Resultado completo del backend:', resultado);
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      console.error('❌ Backend reportó error:', mensaje);
      throw new Error(mensaje || 'Error al crear evaluación');
    }
    
    console.log('🎉 Evaluación creada exitosamente:', dato);
    return dato;
  }

  async obtenerEvaluacionesPorCurso(cursoId: number): Promise<EvaluacionDTO[]> {
    console.log('Obteniendo evaluaciones para curso:', cursoId);
    
    try {
      const headers = await this.getAuthHeaders();
      console.log('Headers de autenticación:', headers);
      
      // Usar el endpoint general que permite docentes
      const generalUrl = `${this.baseUrl}/api/Evaluacion/estudiante/curso/${cursoId}`;
      console.log('Intentando URL general:', generalUrl);
      
      const response = await fetch(generalUrl, {
        headers,
      });

      console.log('Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          errorDetails = await response.text();
        } catch (e) {
          errorDetails = 'No se pudo leer el error del servidor';
        }
        
        console.error('Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          error: errorDetails
        });
        
        throw new Error(`Error al obtener evaluaciones del curso. Status: ${response.status} ${response.statusText}. Error: ${errorDetails}`);
      }

      const resultado = await response.json();
      console.log('Resultado completo del backend:', resultado);
      console.log('📊 Keys del resultado:', Object.keys(resultado));
      
      // El backend puede devolver tanto PascalCase como camelCase
      const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
      const mensaje = resultado.Mensaje ?? resultado.mensaje;
      const dato = resultado.Dato ?? resultado.dato;
      
      console.log('📊 OperacionExitosa:', operacionExitosa);
      console.log('📊 Mensaje:', mensaje);
      console.log('📊 Dato:', dato);
      
      // Manejar respuesta del backend con estructura OperacionExitosa
      if (operacionExitosa === false) {
        throw new Error(mensaje || 'Error al obtener evaluaciones');
      }
      
      const evaluaciones = dato || [];
      console.log('Evaluaciones procesadas:', evaluaciones);
      console.log('📊 Cantidad de evaluaciones:', evaluaciones.length);
      
      return evaluaciones;
    } catch (error) {
      console.error('Error en obtenerEvaluacionesPorCurso:', error);
      // Si hay cualquier error, devolver array vacío
      return [];
    }
  }

  async obtenerEvaluacion(id: number): Promise<EvaluacionDTO> {
    const response = await fetch(`${this.baseUrl}/api/Evaluacion/${id}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener evaluación');
    }

    const resultado = await response.json();
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al obtener evaluación');
    }
    
    return dato || resultado.datos;
  }

  async actualizarEvaluacion(id: number, evaluacion: EvaluacionEdicionDTO): Promise<EvaluacionDTO> {
    const esLaboratorio = evaluacion.esLaboratorio3DLab === true;
    const tiempoLimite = esLaboratorio ? 0 : evaluacion.tiempoLimiteMins;
    const intentosMaximos = esLaboratorio ? 0 : evaluacion.intentosMaximos;
    const fechaInicioIso = esLaboratorio || !evaluacion.fechaInicio ? null : new Date(evaluacion.fechaInicio).toISOString();
    const fechaFinIso = esLaboratorio || !evaluacion.fechaFin ? null : new Date(evaluacion.fechaFin).toISOString();

    const evaluacionBackend = {
      Titulo: evaluacion.titulo,
      Descripcion: evaluacion.descripcion,
      FechaInicio: fechaInicioIso,
      FechaFin: fechaFinIso,
      TiempoLimiteMins: tiempoLimite,
      IntentosMaximos: intentosMaximos,
      EsLaboratorio3DLab: evaluacion.esLaboratorio3DLab,
      PreguntasMinimasLaboratorio: evaluacion.preguntasMinimasLaboratorio,
      PreguntasPorSesionLaboratorio: evaluacion.preguntasPorSesionLaboratorio,
      Activa: evaluacion.activa,
    };

    const response = await fetch(`${this.baseUrl}/api/Evaluacion/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(evaluacionBackend),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al actualizar evaluación: ${error}`);
    }

    const resultado = await response.json();
    
    // Manejar respuesta del backend con estructura OperacionExitosa (PascalCase)
    if (resultado.OperacionExitosa === false) {
      throw new Error(resultado.Mensaje || 'Error al actualizar evaluación');
    }
    
    return resultado.Dato || resultado.datos;
  }

  async eliminarEvaluacion(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/Evaluacion/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al eliminar evaluación');
    }
  }

  // Métodos para estudiantes - RUTAS CORREGIDAS según el backend real
  async obtenerEvaluacionesEstudiante(): Promise<EvaluacionEstudianteDTO[]> {
    const response = await fetch(`${this.baseUrl}/api/estudiante/evaluaciones`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener evaluaciones del estudiante');
    }

    const resultado = await response.json();
    
    // Manejar respuesta del backend con estructura OperacionExitosa (PascalCase)
    if (resultado.OperacionExitosa === false) {
      throw new Error(resultado.Mensaje || 'Error al obtener evaluaciones del estudiante');
    }
    
    return resultado.Dato || resultado.datos || [];
  }

  async obtenerEvaluacionEstudiante(id: number): Promise<EvaluacionEstudianteDTO> {
    console.log('Obteniendo evaluación estudiante con ID:', id);

    // Primero intentar obtener desde las evaluaciones disponibles del estudiante
    try {
      console.log('Intentando obtener desde lista de evaluaciones del estudiante...');
      const evaluaciones = await this.obtenerEvaluacionesEstudiante();
      console.log('Evaluaciones del estudiante obtenidas:', evaluaciones.length);

      const evaluacion = evaluaciones.find(e => e.id === id);
      if (evaluacion) {
        console.log('Evaluación encontrada en lista del estudiante:', evaluacion);
        return evaluacion;
      } else {
        console.log('Evaluación no encontrada en lista del estudiante, IDs disponibles:', evaluaciones.map(e => e.id));
      }
    } catch (error) {
      console.warn('No se pudieron obtener evaluaciones del estudiante, intentando método alternativo:', error);
    }

    // Si no se encuentra en las evaluaciones del estudiante, usar endpoint específico del estudiante
    console.log('Intentando endpoint específico del estudiante...');
    try {
      const response = await fetch(`${this.baseUrl}/api/estudiante/evaluaciones/${id}/info`, {
        headers: await this.getAuthHeaders(),
      });

      console.log('Respuesta del endpoint específico:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en respuesta del endpoint específico:', errorText);
        throw new Error(`Error al obtener evaluación: ${errorText}`);
      }

      const resultado = await response.json();
      console.log('Resultado del backend:', resultado);

      // Manejar respuesta del backend con estructura OperacionExitosa (PascalCase)
      if (resultado.OperacionExitosa === false) {
        console.error('Backend reportó error:', resultado.Mensaje);
        throw new Error(resultado.Mensaje || 'Evaluación no encontrada o no accesible');
      }

      const evaluacionData = resultado.Dato || resultado.datos;
      if (!evaluacionData) {
        console.warn('No se encontraron datos de evaluación en la respuesta, devolviendo evaluación de fallback');
        // Devolver evaluación básica de fallback
        return {
          id: id,
          titulo: 'Evaluación',
          descripcion: 'Información no disponible',
          cursoId: 0,
          cursoNombre: 'Curso desconocido',
          docenteNombre: '',
          fechaCreacion: new Date().toISOString(),
          fechaInicio: undefined,
          fechaFin: undefined,
          tiempoLimiteMins: 0,
          activa: false,
          intentosMaximos: 1,
          totalPreguntas: 0,
          intentosRealizados: 0,
          puedeRealizarEvaluacion: false,
          yaCompletada: false,
          estaEnTiempo: false,
          curso: { nombre: 'Curso desconocido', nrc: '' },
          ultimoIntento: undefined
        };
      }

      console.log('Datos de evaluación obtenidos:', evaluacionData);
      return evaluacionData;

    } catch (error) {
      console.error('Error al usar endpoint específico del estudiante:', error);

      // Si todo falla, devolver una evaluación básica con información mínima
      console.log('Devolviendo evaluación básica de fallback...');
      return {
        id: id,
        titulo: 'Evaluación',
        descripcion: 'Información no disponible',
        cursoId: 0,
        cursoNombre: 'Curso desconocido',
        docenteNombre: '',
        fechaCreacion: new Date().toISOString(),
        fechaInicio: undefined,
        fechaFin: undefined,
        tiempoLimiteMins: 0,
        activa: false,
        intentosMaximos: 1,
        totalPreguntas: 0,
        intentosRealizados: 0,
        puedeRealizarEvaluacion: false,
        yaCompletada: false,
        estaEnTiempo: false,
        curso: { nombre: 'Curso desconocido', nrc: '' },
        ultimoIntento: undefined
      };
    }
  }

  async iniciarEvaluacion(evaluacionId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/estudiante/evaluaciones/${evaluacionId}/iniciar`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al iniciar evaluación: ${error}`);
    }

    const resultado = await response.json();
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al iniciar evaluación');
    }
    
    return dato || resultado.datos;
  }

  async obtenerEvaluacionParaRealizar(evaluacionId: number, token: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/estudiante/evaluaciones/${evaluacionId}?token=${token}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener evaluación para realizar');
    }

    const resultado = await response.json();
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al obtener evaluación para realizar');
    }
    
    return dato || resultado.datos;
  }

  async submitEvaluacion(evaluacionId: number, dto: any, token: string): Promise<any> {
    const submitDto = {
      EvaluacionId: evaluacionId,
      Respuestas: dto.respuestas
    };
    
    const response = await fetch(`${this.baseUrl}/api/estudiante/evaluaciones/${evaluacionId}/responder?token=${token}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(submitDto),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al enviar evaluación: ${error}`);
    }

    const resultado = await response.json();
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al enviar evaluación');
    }
    
    return dato || resultado.datos || resultado;
  }

  async obtenerHistorialEvaluaciones(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/Evaluacion/historial`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener historial de evaluaciones');
    }

    const resultado = await response.json();
    return resultado.datos;
  }

  async obtenerResultadosEstudiantesEvaluacion(evaluacionId: number, usuarioId: string, numeroIntento: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/Evaluacion/${evaluacionId}/resultado/${usuarioId}/${numeroIntento}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener resultado específico');
    }

    const resultado = await response.json();
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al obtener resultado específico');
    }
    
    return dato || resultado.datos || resultado;
  }

  async obtenerResultadosEvaluacion(evaluacionId: number, numeroIntento: number): Promise<ResultadoEvaluacionDTO> {
    const response = await fetch(`${this.baseUrl}/api/estudiante/evaluaciones/${evaluacionId}/resultado/${numeroIntento}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al obtener resultados de evaluación:', errorText);
      throw new Error(`Error al obtener resultados: ${errorText}`);
    }

    const resultado = await response.json();
    console.log('Resultado de evaluación obtenido:', resultado);

    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;

    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al obtener resultados de evaluación');
    }

    return dato || resultado.datos;
  }

  // Método para estadísticas (resultados de estudiantes)
  async obtenerEstadisticasEvaluacion(evaluacionId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/Evaluacion/${evaluacionId}/resultados`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas de la evaluación');
    }

    const resultado = await response.json();
    
    // El backend puede devolver tanto PascalCase como camelCase
    const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
    const mensaje = resultado.Mensaje ?? resultado.mensaje;
    const dato = resultado.Dato ?? resultado.dato;
    
    // Manejar respuesta del backend con estructura OperacionExitosa
    if (operacionExitosa === false) {
      throw new Error(mensaje || 'Error al obtener estadísticas de la evaluación');
    }
    
    return dato || resultado.datos || resultado;
  }

  async obtenerRespuestasEstudiantes(evaluacionId: number): Promise<any[]> {
    // Método alternativo para obtener respuestas de estudiantes
    try {
      const response = await fetch(`${this.baseUrl}/api/Evaluacion/${evaluacionId}/respuestas`, {
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        // Si no existe la ruta específica, devolver array vacío
        return [];
      }

      const resultado = await response.json();

      // El backend puede devolver tanto PascalCase como camelCase
      const operacionExitosa = resultado.OperacionExitosa ?? resultado.operacionExitosa;
      const mensaje = resultado.Mensaje ?? resultado.mensaje;
      const dato = resultado.Dato ?? resultado.dato;

      // Manejar respuesta del backend con estructura OperacionExitosa
      if (operacionExitosa === false) {
        throw new Error(mensaje || 'Error al obtener respuestas de estudiantes');
      }

      return dato || resultado.datos || [];
    } catch (error) {
      console.warn('Ruta de respuestas de estudiantes no disponible:', error);
      return [];
    }
  }

}

export const evaluacionService = new EvaluacionService();
