import { BloqueMemoria } from "../models/BloqueMemoria";
import { Proceso } from "../models/Proceso";
import { MetricasMemoria } from "../types/MetricasMemoria";
import { IEstrategiaAsignacion } from "./IEstrategiaAsignacion";
import { FirstFit } from "./FirstFit";
import { BestFit } from "./BestFit";
import { WorstFit } from "./WorstFit";

// ==============================================================================
// ADMINISTRADOR DE MEMORIA (1024 KB, ASIGNACIONES Y COALESCENCIA)
// ==============================================================================

export class AdministradorMemoria {
  private _tamano_total: number = 0; // Tamaño total de la RAM en KB
  private _bloques: BloqueMemoria[] = []; // Lista ordenada de particiones

  constructor(tamanoTotal: number = 1024) {
    this.setTamanoTotal(tamanoTotal);
    // Al iniciar, la memoria completa es un único bloque libre
    this.setBloques([new BloqueMemoria(0, tamanoTotal, true)]);
  }

  protected setTamanoTotal(value: number): void {
    this._tamano_total = value;
  }

  getTamanoTotal(): number {
    return this._tamano_total;
  }

  private setBloques(value: BloqueMemoria[]): void {
    this._bloques = value;
  }

  /* Devuelve una copia de la lista para que nadie de afuera la modifique */
  getBloques(): BloqueMemoria[] {
    return [...this._bloques];
  }

  /*
     Recorre la lista de particiones y fusiona bloques libres contiguos en uno solo.
     Esencial para reducir la fragmentación externa tras liberar memoria.
    */
  coalescencia(): void {
    const bloques = this.getBloques();
    let i = 0;
    while (i < bloques.length - 1) {
      const actual = bloques[i];
      const siguiente = bloques[i + 1];

      // Si dos bloques contiguos están libres, se unen sumando sus capacidades
      if (actual.isLibre() && siguiente.isLibre()) {
        actual.setTamano(actual.getTamano() + siguiente.getTamano());
        bloques.splice(i + 1, 1); // Se remueve el bloque absorbido
        // No incrementamos 'i' porque el bloque actual creció
        // y podría volver a fusionarse con el que le sigue
      } else {
        i++;
      }
    }
    this.setBloques(bloques);
  }

  // Función interna: divide el bloque libre si sobra espacio y lo marca ocupado.
  private partirYAsignar(indice: number, proceso: Proceso): void {
    const bloques = this.getBloques();
    const bloque = bloques[indice];
    const requerido = proceso.getTamanoMemoria();

    if (bloque.getTamano() > requerido) {
      const sobrante = bloque.getTamano() - requerido;
      const nuevoBloqueLibre = new BloqueMemoria(
        bloque.getInicio() + requerido,
        sobrante,
        true,
        null,
      );
      bloque.setTamano(requerido);
      bloques.splice(indice + 1, 0, nuevoBloqueLibre);
    }
    bloque.setLibre(false);
    bloque.setPid(proceso.getPid());
    this.setBloques(bloques);
  }

  // Busca el primer hueco libre donde quepa el proceso.
  asignarFirstFit(proceso: Proceso): boolean {
    return this.asignar(proceso, new FirstFit());
  }

  // Busca el bloque libre que deje el menor desperdicio de espacio residual.
  asignarBestFit(proceso: Proceso): boolean {
    return this.asignar(proceso, new BestFit());
  }

  // Busca el bloque libre de mayor tamaño absoluto.
  asignarWorstFit(proceso: Proceso): boolean {
    return this.asignar(proceso, new WorstFit());
  }

  // Libera la memoria de un proceso y ejecuta la coalescencia automática.
  liberar(pid: string): boolean {
    const bloque = this.getBloques().find((b) => b.getPid() === pid);
    if (!bloque) return false;
    bloque.setLibre(true);
    bloque.setPid(null);
    this.coalescencia();
    return true;
  }

  //Calcula memoria libre, ocupada, mayor bloque contiguo y fragmentación externa.
  obtenerMetricas(): MetricasMemoria {
    const bloques = this.getBloques();
    const ocupada = bloques
      .filter((b) => !b.isLibre())
      .reduce((acc, b) => acc + b.getTamano(), 0);
    const huecosLibres = bloques
      .filter((b) => b.isLibre())
      .map((b) => b.getTamano());
    const libreTotal = huecosLibres.reduce((acc, t) => acc + t, 0);
    const mayorHueco = huecosLibres.length > 0 ? Math.max(...huecosLibres) : 0;

    const porcOcupacion = (ocupada / this.getTamanoTotal()) * 100;

    // Fórmula exigida por la cátedra para fragmentación externa
    const fragExterna =
      libreTotal > 0 ? (1.0 - mayorHueco / libreTotal) * 100.0 : 0.0;

    return { ocupada, libreTotal, mayorHueco, porcOcupacion, fragExterna };
  }

  // Muestra la tabla de bloques en consola.
  imprimirMapa(): void {
    console.log("   [MAPA DE MEMORIA]");
    for (const b of this.getBloques()) {
      const estadoStr = b.isLibre() ? "LIBRE" : `OCUPADO por ${b.getPid()}`;
      const inicio = String(b.getInicio()).padStart(4);
      const fin = String(b.getFin()).padStart(4);
      const tamano = String(b.getTamano()).padStart(4);
      console.log(
        `   [${inicio} KB - ${fin} KB] (${tamano} KB) -> ${estadoStr}`,
      );
    }
  }
  /** Asigna el proceso con la estrategia recibida: funciona igual para cualquier política. */
  asignar(proceso: Proceso, estrategia: IEstrategiaAsignacion): boolean {
    const indice = estrategia.seleccionar(
      this.getBloques(),
      proceso.getTamanoMemoria(),
    );
    if (indice === -1) return false;
    this.partirYAsignar(indice, proceso);
    return true;
  }
}
