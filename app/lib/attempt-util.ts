// Client-side helper to ensure there's a session/token for an evaluation.
// It will reuse a session stored in sessionStorage when possible, validate it
// against the backend, and fall back to starting a new session.
import { evaluacionService } from './evaluacion-service';

export interface EvaluacionSessionInfo {
  token: string;
  numeroIntento: number;
  fechaInicio?: string;
  tiempoLimiteMins?: number;
}

const storageKey = (evaluacionId: number) => `evaluacion_session_${evaluacionId}`;

const parseSessionInfo = (raw: unknown): EvaluacionSessionInfo => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respuesta de sesión inválida');
  }

  const data = raw as Record<string, unknown>;

  const tokenCandidate = data.token ?? data.Token;
  if (typeof tokenCandidate !== 'string' || tokenCandidate.trim().length === 0) {
    throw new Error('Sesión sin token válido');
  }

  const numeroIntentoRaw = data.numeroIntento ?? data.NumeroIntento;
  const numeroIntentoParsed = typeof numeroIntentoRaw === 'number'
    ? numeroIntentoRaw
    : typeof numeroIntentoRaw === 'string'
      ? Number.parseInt(numeroIntentoRaw, 10)
      : undefined;
  const numeroIntento = Number.isFinite(numeroIntentoParsed ?? NaN) ? Number(numeroIntentoParsed) : 1;

  const fechaInicioRaw = data.fechaInicio ?? data.FechaInicio;
  const fechaInicio = typeof fechaInicioRaw === 'string' && fechaInicioRaw.trim().length > 0
    ? fechaInicioRaw
    : undefined;

  const tiempoLimiteRaw = data.tiempoLimiteMins ?? data.TiempoLimiteMins;
  let tiempoLimiteMins: number | undefined;
  if (typeof tiempoLimiteRaw === 'number' && Number.isFinite(tiempoLimiteRaw)) {
    tiempoLimiteMins = tiempoLimiteRaw;
  } else if (typeof tiempoLimiteRaw === 'string') {
    const parsed = Number.parseInt(tiempoLimiteRaw, 10);
    if (Number.isFinite(parsed)) {
      tiempoLimiteMins = parsed;
    }
  }

  return {
    token: tokenCandidate,
    numeroIntento,
    fechaInicio,
    tiempoLimiteMins,
  };
};

export async function ensureEvaluacionSession(evaluacionId: number): Promise<EvaluacionSessionInfo> {
  // Run only in browser
  if (typeof window === 'undefined' || !window.sessionStorage) {
    // Fallback: just call iniciarEvaluacion
    const dtoRaw = await evaluacionService.iniciarEvaluacion(evaluacionId);
    return parseSessionInfo(dtoRaw);
  }

  const key = storageKey(evaluacionId);
  const raw = sessionStorage.getItem(key);
  if (raw) {
    try {
      const parsed: EvaluacionSessionInfo = JSON.parse(raw);
      if (parsed?.token) {
        // Validate token by requesting the evaluation payload for realizar
        try {
          await evaluacionService.obtenerEvaluacionParaRealizar(evaluacionId, parsed.token);
          sessionStorage.setItem('evaluacion_token', parsed.token);
          sessionStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        } catch (err) {
          // token invalid/expired - continue to create new
          console.warn('Evaluacion session token invalid, creating new:', err);
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored evaluacion session:', e);
    }
  }

  // Create new session
  const dtoRaw = await evaluacionService.iniciarEvaluacion(evaluacionId);
  const info = parseSessionInfo(dtoRaw);

  try {
    sessionStorage.setItem(key, JSON.stringify(info));
    // Also keep backwards-compatible key used elsewhere
    sessionStorage.setItem('evaluacion_token', info.token);
  } catch (e) {
    console.warn('Could not persist evaluacion session in sessionStorage:', e);
  }

  return info;
}
