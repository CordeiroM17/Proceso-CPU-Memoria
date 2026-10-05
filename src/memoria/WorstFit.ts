import type { BloqueMemoria } from "../models/BloqueMemoria";
import { EstrategiaAsignacion } from "./EstrategiasAsignacion";

/** Elige el hueco más grande disponible. */
export class WorstFit extends EstrategiaAsignacion {
  getNombre(): string {
    return "Worst-Fit";
  }

  protected elegir(candidatos: number[], bloques: BloqueMemoria[]): number {
    return candidatos.reduce((peor, i) =>
      bloques[i].getTamano() > bloques[peor].getTamano() ? i : peor,
    );
  }
}
