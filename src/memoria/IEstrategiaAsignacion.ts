import type { BloqueMemoria } from "../models/BloqueMemoria";

/** Contrato de una política de asignación contigua (RF04). */
export interface IEstrategiaAsignacion {
  getNombre(): string;
  /** Índice del bloque elegido en la lista, o -1 si ningún hueco libre alcanza. */
  seleccionar(bloques: BloqueMemoria[], requerido: number): number;
}
