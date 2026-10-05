/** True si el valor es un entero mayor que cero (RF01, RF02 y RF08). */
export function esEnteroPositivo(valor: number): boolean {
  return Number.isInteger(valor) && valor > 0;
}
