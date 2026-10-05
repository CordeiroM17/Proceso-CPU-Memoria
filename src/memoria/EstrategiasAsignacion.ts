import type { BloqueMemoria } from "../models/BloqueMemoria";
import type { IEstrategiaAsignacion } from "./IEstrategiaAsignacion";

export abstract class EstrategiaAsignacion implements IEstrategiaAsignacion {
  abstract getNombre(): string;

  /** Elige uno de los candidatos (índices de bloques libres donde entra el proceso). */
  protected abstract elegir(
    candidatos: number[],
    bloques: BloqueMemoria[],
  ): number;

  seleccionar(bloques: BloqueMemoria[], requerido: number): number {
    const candidatos: number[] = [];
    bloques.forEach((b, i) => {
      if (b.isLibre() && b.getTamano() >= requerido) candidatos.push(i);
    });
    return candidatos.length === 0 ? -1 : this.elegir(candidatos, bloques);
  }
}
