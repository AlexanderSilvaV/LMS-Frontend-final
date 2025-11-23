// Script para limpiar localStorage y debuggear problemas
// Ejecutar en la consola del navegador: copy(this code) y pegar

// Limpiar todo el localStorage relacionado con evaluaciones
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('evaluacion_progreso_') || key.includes('evaluacion')) {
    console.log('Eliminando:', key);
    localStorage.removeItem(key);
  }
});

// Verificar que se limpió
console.log('Keys restantes relacionadas con evaluaciones:');
Object.keys(localStorage).filter(key =>
  key.startsWith('evaluacion_progreso_') || key.includes('evaluacion')
).forEach(key => console.log(key));

// Limpiar completamente localStorage si es necesario
// localStorage.clear();

console.log('localStorage limpiado. Recarga la página.');