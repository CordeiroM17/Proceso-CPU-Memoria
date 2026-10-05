import { EstadoProceso } from "../types/EstadoMemoria";
import { VistaProceso } from "../types/VistaProceso";
import { esEnteroPositivo } from "../utils/validaciones";
// ------------------------------------------------------------------------------
// 1. ESTRUCTURAS DE DATOS (CLASES BASE)
// ------------------------------------------------------------------------------

export class Proceso {
  private _pid: string = "P0"; // Identificador único (ej: "P1")
  private _tamano_memoria: number = 0; // Memoria requerida en KB
  private _tiempo_cpu_total: number = 0; // Ticks totales que demanda la CPU
  private _tiempo_cpu_restante: number = 0; // Ticks que le faltan para terminar
  private _estado: EstadoProceso = "NUEVO";
  private _quantum_consumido: number = 0; // Ticks consecutivos que lleva en CPU en su turno
  private _tiempo_bloqueo_restante: number = 0; // Ticks restantes que debe esperar en E/S
  private _cpu_para_es: number = 0; // Ticks de CPU consumidos tras los cuales pide E/S (0 = nunca pide)
  private _duracion_es: number = 0; // Ticks que dura su bloqueo por E/S
  private _es_disparada: boolean = false; // true cuando ya pidió su E/S (se dispara una sola vez)

  constructor(
    pid: string,
    tamanoMemoria: number,
    tiempoCpuTotal: number,
    cpuParaEs: number = 0,
    duracionEs: number = 0,
  ) {
    this.setPid(pid);
    this.setTamanoMemoria(tamanoMemoria);
    this.setTiempoCpuTotal(tiempoCpuTotal);
    this.setTiempoCpuRestante(tiempoCpuTotal);
    this.setEstado("NUEVO");
    this.setQuantumConsumido(0);
    this.setTiempoBloqueoRestante(0);
    this.setCpuParaEs(cpuParaEs);
    this.setDuracionEs(duracionEs);
    this.setEsDisparada(false);
  }

  protected setPid(value: string): void {
    this._pid = value;
  }

  getPid(): string {
    return this._pid;
  }

  protected setTamanoMemoria(value: number): void {
    this._tamano_memoria = value;
  }

  getTamanoMemoria(): number {
    return this._tamano_memoria;
  }

  protected setTiempoCpuTotal(value: number): void {
    this._tiempo_cpu_total = value;
  }

  getTiempoCpuTotal(): number {
    return this._tiempo_cpu_total;
  }

  setTiempoCpuRestante(value: number): void {
    this._tiempo_cpu_restante = value;
  }

  getTiempoCpuRestante(): number {
    return this._tiempo_cpu_restante;
  }

  setEstado(value: EstadoProceso): void {
    this._estado = value;
  }

  getEstado(): EstadoProceso {
    return this._estado;
  }

  setQuantumConsumido(value: number): void {
    this._quantum_consumido = value;
  }

  getQuantumConsumido(): number {
    return this._quantum_consumido;
  }

  setTiempoBloqueoRestante(value: number): void {
    this._tiempo_bloqueo_restante = value;
  }

  getTiempoBloqueoRestante(): number {
    return this._tiempo_bloqueo_restante;
  }

  // --- Evento de entrada/salida (RF08) ---

  protected setCpuParaEs(value: number): void {
    this._cpu_para_es = value;
  }

  getCpuParaEs(): number {
    return this._cpu_para_es;
  }

  protected setDuracionEs(value: number): void {
    this._duracion_es = value;
  }

  getDuracionEs(): number {
    return this._duracion_es;
  }

  setEsDisparada(value: boolean): void {
    this._es_disparada = value;
  }

  getEsDisparada(): boolean {
    return this._es_disparada;
  }

  esValido(): boolean {
    const datosValidos =
      this.getPid() !== "" &&
      esEnteroPositivo(this.getTamanoMemoria()) &&
      esEnteroPositivo(this.getTiempoCpuTotal());

    if (this.getCpuParaEs() === 0) {
      return datosValidos && this.getDuracionEs() === 0;
    }
    return (
      datosValidos &&
      esEnteroPositivo(this.getCpuParaEs()) &&
      esEnteroPositivo(this.getDuracionEs()) &&
      this.getCpuParaEs() < this.getTiempoCpuTotal()
    );
  }

  /** True si ya consumió la CPU que dispara su E/S y todavía no la pidió. */
  debeBloquearse(): boolean {
    const consumido = this.getTiempoCpuTotal() - this.getTiempoCpuRestante();
    return (
      this.getCpuParaEs() > 0 &&
      !this.getEsDisparada() &&
      consumido === this.getCpuParaEs()
    );
  }

  /** Copia congelada del estado actual: se puede mostrar sin riesgo de modificar el proceso (RF10). */
  getVista(): VistaProceso {
    return Object.freeze({
      pid: this.getPid(),
      estado: this.getEstado(),
      tamanoMemoria: this.getTamanoMemoria(),
      tiempoCpuTotal: this.getTiempoCpuTotal(),
      tiempoCpuRestante: this.getTiempoCpuRestante(),
      quantumConsumido: this.getQuantumConsumido(),
      tiempoBloqueoRestante: this.getTiempoBloqueoRestante(),
    });
  }
}
