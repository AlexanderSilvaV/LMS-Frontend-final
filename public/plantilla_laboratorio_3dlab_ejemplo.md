# 📋 Guía de Uso: Plantilla Laboratorio 3DLAB

## ⚠️ Error Común

Si ves estos errores:
```
Fila 2: El enunciado es obligatorio.
Fila 2: Los puntos deben ser un número entre 1 y 100.
Fila 2: Debe completar al menos las opciones A y B.
```

Significa que **las filas están vacías o mal formateadas**.

## ✅ Cómo Usar la Plantilla Correctamente

### Paso 1: Descargar
En el apartado de Laboratorios, haz clic en **"Descargar plantilla"**

### Paso 2: Revisar Ejemplos
La plantilla incluye 2 preguntas de ejemplo. **NO LAS BORRES** hasta que entiendas el formato.

### Paso 3: Agregar Tus Preguntas
- **Opción A**: Agrega tus preguntas en las filas 4, 5, 6, etc. (dejando los ejemplos)
- **Opción B**: Reemplaza los ejemplos (filas 2 y 3) con tus propias preguntas

### Paso 4: Validar Formato
Antes de importar, verifica cada fila:

| Campo | ¿Qué debe contener? | Ejemplo |
|-------|---------------------|---------|
| **Enunciado** | Texto de la pregunta | "¿Cuál es la capital de Chile?" |
| **Categoria** | Nombre de categoría | "Geografía" |
| **Puntos** | **Número** entre 1-100 | 10 (no "diez") |
| **OpcionA** | Texto primera opción | "Santiago" |
| **OpcionB** | Texto segunda opción | "Valparaíso" |
| **OpcionC** | Texto tercera opción (opcional) | "Concepción" |
| **OpcionD** | Texto cuarta opción (opcional) | "La Serena" |
| **RespuestaCorrecta** | Solo **A**, **B**, **C** o **D** | A |
| **Retroalimentacion** | Explicación (opcional) | "Santiago es la capital y ciudad más grande de Chile" |

## ❌ Errores Comunes

### Error 1: Puntos en texto
```
❌ Puntos: "cinco"
✅ Puntos: 5
```

### Error 2: Respuesta incorrecta
```
❌ RespuestaCorrecta: "Opción A"
❌ RespuestaCorrecta: "a"
✅ RespuestaCorrecta: A
```

### Error 3: Opciones vacías
```
❌ OpcionA: (vacío)
✅ OpcionA: "Respuesta correcta"
```

### Error 4: Fila completamente vacía
```
❌ Todas las celdas vacías
✅ Cada celda debe tener contenido (excepto OpcionC, OpcionD y Retroalimentacion que son opcionales)
```

## 💡 Consejos

1. **Usa los ejemplos como guía**: Son preguntas reales que puedes modificar
2. **Copia el formato**: Selecciona una fila ejemplo y cópiala antes de modificar
3. **Prueba con pocas preguntas**: Importa 2-3 preguntas primero para verificar
4. **Revisa el tipo de datos**: Excel puede cambiar números a texto automáticamente
5. **Guarda como .xlsx**: No uses formatos antiguos como .xls

## 🔧 Si Persiste el Error

Si después de seguir esta guía sigues viendo errores:

1. **Revisa que Puntos sea número**: Haz clic en la celda, si ves `'10` en vez de `10`, borra el apóstrofo
2. **Verifica RespuestaCorrecta**: Debe ser solo la letra, sin espacios: `A` no ` A ` o `A.`
3. **Chequea las opciones**: OpcionA y OpcionB no pueden estar vacías
4. **Formato del archivo**: Asegúrate de guardarlo como .xlsx (Excel 2007 o superior)

## 📞 Estructura Final Esperada

```
Fila 1: Encabezados (NO MODIFICAR)
Fila 2: Primera pregunta
Fila 3: Segunda pregunta
Fila 4: Tercera pregunta
...y así sucesivamente
```

---

**Recuerda**: Los ejemplos en la plantilla funcionan perfectamente. Si los ejemplos se importan bien pero tus preguntas no, el problema está en cómo estás llenando las celdas.
