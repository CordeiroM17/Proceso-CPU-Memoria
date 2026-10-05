import type { BloqueMemoria } from "../models/BloqueMemoria";
import { EstrategiaAsignacion } from "./EstrategiasAsignacion";

/** Elige el primer hueco (de menor dirección) donde entra el proceso. */
export class FirstFit extends EstrategiaAsignacion {
  getNombre(): string {
    return "First-Fit";
  }

  protected elegir(candidatos: number[], _bloques: BloqueMemoria[]): number {
    return candidatos[0];
  }
}
