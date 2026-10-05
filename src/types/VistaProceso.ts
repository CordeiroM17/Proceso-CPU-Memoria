import type { EstadoProceso } from "./EstadoMemoria";

/** Foto de solo lectura de un proceso (RF10). */
export interface VistaProceso {
  readonly pid: string;
  readonly estado: EstadoProceso;
  readonly tamanoMemoria: number;
  readonly tiempoCpuTotal: number;
  readonly tiempoCpuRestante: number;
  readonly quantumConsumido: number;
  readonly tiempoBloqueoRestante: number;
}
