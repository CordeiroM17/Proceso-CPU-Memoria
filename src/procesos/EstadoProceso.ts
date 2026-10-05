/** RF03: estados del ciclo de vida de un proceso. */
export enum EstadoProceso {
  NUEVO = "Nuevo",
  ESPERANDO_MEMORIA = "Esperando Memoria",
  LISTO = "Listo",
  EJECUTANDO = "Ejecutando",
  BLOQUEADO = "Bloqueado",
  TERMINADO = "Terminado",
}
