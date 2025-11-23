"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { evaluacionService } from "@/app/lib/evaluacion-service";
import { type EvaluacionDTO } from "@/DTOs/EvaluacionDTOs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";

interface ResultadoLaboratorio {
  usuarioRut: string;
  usuarioNombre: string;
  correo?: string;
  nota?: number;
  porcentaje?: number;
  intentos?: number;
  fechaRealizacion?: string;
  completada?: boolean;
  [key: string]: unknown;
}

const normalizarResultado = (raw: any): ResultadoLaboratorio => {
  if (!raw) {
    return {
      usuarioRut: "N/A",
      usuarioNombre: "N/A",
      correo: "N/A",
      nota: undefined,
      porcentaje: undefined,
      intentos: 0,
      fechaRealizacion: undefined,
      completada: false,
    };
  }

  return {
    usuarioRut: raw.usuarioRut ?? raw.UsuarioRut ?? "N/A",
    usuarioNombre: raw.nombreCompleto ?? raw.NombreCompleto ?? raw.usuarioNombre ?? raw.UsuarioNombre ?? "N/A",
    correo: raw.correo ?? raw.Correo ?? "N/A",
    nota: raw.nota ?? raw.Nota ?? undefined,
    porcentaje: raw.porcentaje ?? raw.Porcentaje ?? undefined,
    intentos: raw.intentos ?? raw.Intentos ?? raw.numeroIntentos ?? raw.NumeroIntentos ?? 0,
    fechaRealizacion: raw.fechaRealizacion ?? raw.FechaRealizacion ?? raw.ultimaFecha ?? raw.UltimaFecha ?? undefined,
    completada: raw.completada ?? raw.Completada ?? false,
  };
};

const calcularResumen = (resultados: ResultadoLaboratorio[]) => {
  if (resultados.length === 0) {
    return {
      totalEstudiantes: 0,
      completados: 0,
      promedioNota: 0,
      promedioPorcentaje: 0,
      totalIntentos: 0,
    };
  }

  const completados = resultados.filter((res) => res.completada).length;
  const notas = resultados.filter((res) => typeof res.nota === "number").map((res) => res.nota as number);
  const porcentajes = resultados
    .filter((res) => typeof res.porcentaje === "number")
    .map((res) => res.porcentaje as number);
  const intentos = resultados.map((res) => res.intentos ?? 0);

  const promedioNota = notas.length ? notas.reduce((acc, val) => acc + val, 0) / notas.length : 0;
  const promedioPorcentaje = porcentajes.length ? porcentajes.reduce((acc, val) => acc + val, 0) / porcentajes.length : 0;
  const totalIntentos = intentos.reduce((acc, val) => acc + val, 0);

  return {
    totalEstudiantes: resultados.length,
    completados,
    promedioNota,
    promedioPorcentaje,
    totalIntentos,
  };
};

const formatFecha = (valor?: string) => {
  if (!valor) return "N/A";

  try {
    return format(new Date(valor), "dd/MM/yyyy HH:mm", { locale: es });
  } catch (error) {
    console.warn("No se pudo formatear la fecha", valor, error);
    return valor;
  }
};

export default function ResultadosLaboratorioPage() {
  const params = useParams();
  const router = useRouter();
  const laboratorioIdParam = params?.laboratorioId;
  const laboratorioId = laboratorioIdParam ? Number.parseInt(String(laboratorioIdParam), 10) : NaN;

  const [laboratorio, setLaboratorio] = useState<EvaluacionDTO | null>(null);
  const [resultados, setResultados] = useState<ResultadoLaboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(laboratorioId)) {
  setError("Identificador de laboratorio no valido");
      setLoading(false);
      return;
    }

    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [detalle, estadisticas] = await Promise.all([
          evaluacionService.obtenerEvaluacion(laboratorioId),
          evaluacionService.obtenerEstadisticasEvaluacion(laboratorioId),
        ]);

        if (!detalle.esLaboratorio3DLab) {
          toast({
            title: "Advertencia",
            description: "La evaluacion seleccionada no esta configurada como laboratorio 3DLAB.",
          });
        }

        setLaboratorio(detalle);

        if (Array.isArray(estadisticas)) {
          setResultados(estadisticas.map(normalizarResultado));
        } else if (estadisticas?.resultados && Array.isArray(estadisticas.resultados)) {
          setResultados(estadisticas.resultados.map(normalizarResultado));
        } else {
          setResultados([]);
        }
      } catch (err: any) {
        console.error("Error al cargar resultados del laboratorio", err);
  const message = err?.message ?? "No se pudieron cargar los resultados";
        setError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    void cargarDatos();
  }, [laboratorioId]);

  const resumen = useMemo(() => calcularResumen(resultados), [resultados]);

  const descargarExcel = () => {
    if (!laboratorio) return;

    if (resultados.length === 0) {
      toast({ title: "Sin datos", description: "No hay resultados disponibles para exportar." });
      return;
    }

    const datosExcel = resultados.map((resultado) => ({
      RUT: resultado.usuarioRut,
      Nombre: resultado.usuarioNombre,
      Correo: resultado.correo ?? "N/A",
      Nota: typeof resultado.nota === "number" ? resultado.nota : "Pendiente",
      Porcentaje:
        typeof resultado.porcentaje === "number" ? `${resultado.porcentaje.toFixed(2)}%` : "Sin dato",
      "Numero de intentos": resultado.intentos ?? 0,
      "Ultima realizacion": formatFecha(resultado.fechaRealizacion),
      Estado: resultado.completada ? "Completada" : "Pendiente",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Resultados");

    const tituloLimpio = laboratorio.titulo.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
    const marcaTiempo = format(new Date(), "yyyy-MM-dd_HH-mm", { locale: es });
    const nombreArchivo = `laboratorio_${tituloLimpio}_${marcaTiempo}.xlsx`;

    XLSX.writeFile(libro, nombreArchivo);
    toast({ title: "Descarga completada", description: "Archivo Excel generado correctamente." });
  };

  const renderContenido = () => {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-2 text-sm text-muted-foreground">Cargando resultados del laboratorio...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Error al cargar resultados</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.refresh()}>Reintentar</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!laboratorio) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>Laboratorio no encontrado</CardTitle>
              <CardDescription>Verifica el enlace e intentalo nuevamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push("/teacher/labs")}>Volver</Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Resultados del laboratorio</h1>
            <p className="text-sm text-muted-foreground">{laboratorio.titulo}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/teacher/labs")}>Regresar</Button>
            <Button onClick={descargarExcel} disabled={resultados.length === 0}>Exportar Excel</Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
            <CardDescription>
              Vista general del desempeno de las y los estudiantes en este laboratorio 3DLAB.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Estudiantes con actividad</p>
                <p className="text-2xl font-semibold">{resumen.totalEstudiantes}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-semibold">{resumen.completados}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Promedio nota</p>
                <p className="text-2xl font-semibold">{resumen.promedioNota.toFixed(1)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Promedio porcentaje</p>
                <p className="text-2xl font-semibold">{resumen.promedioPorcentaje.toFixed(1)}%</p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">Intentos totales registrados: {resumen.totalIntentos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle por estudiante</CardTitle>
            <CardDescription>
              Incluye calificaciones, porcentaje obtenido, numero de intentos y fecha de la ultima participacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Porcentaje</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Ultima realizacion</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                      No se registran resultados para este laboratorio.
                    </TableCell>
                  </TableRow>
                ) : (
                  resultados.map((resultado, index) => (
                    <TableRow key={`${resultado.usuarioRut}-${index}`}>
                      <TableCell className="font-medium">{resultado.usuarioNombre}</TableCell>
                      <TableCell>{resultado.usuarioRut}</TableCell>
                      <TableCell>{resultado.correo ?? "N/A"}</TableCell>
                      <TableCell>{typeof resultado.nota === "number" ? resultado.nota.toFixed(1) : "Pendiente"}</TableCell>
                      <TableCell>
                        {typeof resultado.porcentaje === "number"
                          ? `${resultado.porcentaje.toFixed(1)}%`
                          : "Sin dato"}
                      </TableCell>
                      <TableCell>{resultado.intentos ?? 0}</TableCell>
                      <TableCell>{formatFecha(resultado.fechaRealizacion)}</TableCell>
                      <TableCell>
                        <Badge variant={resultado.completada ? "default" : "secondary"}>
                          {resultado.completada ? "Completada" : "Pendiente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-unab-gray-50 dark:bg-unab-navy-dark">
      <Sidebar role="teacher" />
      <div className="flex flex-1 flex-col lg:ml-64">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">{renderContenido()}</main>
      </div>
    </div>
  );
}
