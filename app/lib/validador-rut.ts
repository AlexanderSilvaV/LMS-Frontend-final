export function isRutValido(rut: string): boolean {
  if (!rut) return false

  // Normalizar: quitar puntos y guión, pasar a mayúsculas
  const limpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase().trim()

  if (!/^[0-9]+[0-9K]$/.test(limpio)) return false

  const cuerpo = limpio.slice(0, -1)
  const dvIngresado = limpio.slice(-1)

  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo.charAt(i)) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }

  const resto = 11 - (suma % 11)
  let dvEsperado = ""
  if (resto === 11) dvEsperado = "0"
  else if (resto === 10) dvEsperado = "K"
  else dvEsperado = String(resto)

  return dvEsperado === dvIngresado
}

export default isRutValido
