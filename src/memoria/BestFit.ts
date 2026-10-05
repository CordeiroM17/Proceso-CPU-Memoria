import type { BloqueMemoria } from "../models/BloqueMemoria";
import { EstrategiaAsignacion } from "./EstrategiasAsignacion";

/** Elige el hueco más chico donde entra el proceso (menor desperdicio). */
export class BestFit extends EstrategiaAsignacion {
  getNombre(): string {
    return "Best-Fit";
  }

  protected elegir(candidatos: number[], bloques: BloqueMemoria[]): number {
    return candidatos.reduce((mejor, i) =>
      bloques[i].getTamano() < bloques[mejor].getTamano() ? i : mejor,
    );
  }
}
