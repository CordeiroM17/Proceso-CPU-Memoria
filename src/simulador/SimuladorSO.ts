import { AdministradorMemoria } from "../memoria/AdministradorMemoria";
import { AlgoritmoMemoria } from "../types/AlgoritmoMemoria";
import { Proceso } from "../models/Proceso";
// ==============================================================================
// MOTOR DEL SIMULADOR (TICKS Y PLANIFICADOR ROUND-ROBIN)
// ==============================================================================

export class SimuladorSO {
  private _memoria: AdministradorMemoria = new AdministradorMemoria(1024);
  private _algoritmo_memoria: AlgoritmoMemoria = "FIRST_FIT"; // FIRST_FIT, BEST_FIT o WORST_FIT
  private _quantum_limite: number = 2;

  // Colas de procesos
  private _cola_nuevos: Proceso[] = [];
  private _cola_esperando_memoria: Proceso[] = [];
  private _cola_listos: Proceso[] = [];
  private _cola_bloqueados: Proceso[] = [];
  private _procesos_terminados: Proceso[] = [];

  // Estado de CPU y estadísticas
  private _cpu_proceso: Proceso | null = null;
  private _reloj_tick: number = 0;
  private _cambios_contexto: number = 0;
  private _ticks_cpu_ocupada: number = 0;

  constructor(
    algoritmoMemoria: AlgoritmoMemoria = "FIRST_FIT",
    quantum: number = 2,
  ) {
    this.setMemoria(new AdministradorMemoria(1024));
    this.setAlgoritmoMemoria(algoritmoMemoria);
    this.setQuantumLimite(quantum);
  }

  // Configuración
  private setMemoria(value: AdministradorMemoria): void {
    this._memoria = value;
  }

  getMemoria(): AdministradorMemoria {
    return this._memoria;
  }

  setAlgoritmoMemoria(value: AlgoritmoMemoria): void {
    this._algoritmo_memoria = value;
  }

  getAlgoritmoMemoria(): AlgoritmoMemoria {
    return this._algoritmo_memoria;
  }

  setQuantumLimite(value: number): void {
    if (value < 1) throw new Error("El quantum debe ser al menos 1 tick");
    this._quantum_limite = value;
  }

  getQuantumLimite(): number {
    return this._quantum_limite;
  }

  // Colas (los getters devuelven copias, solo el simulador las modifica)
  private setColaNuevos(value: Proceso[]): void {
    this._cola_nuevos = value;
  }

  getColaNuevos(): Proceso[] {
    return [...this._cola_nuevos];
  }

  private setColaEsperandoMemoria(value: Proceso[]): void {
    this._cola_esperando_memoria = value;
  }

  getColaEsperandoMemoria(): Proceso[] {
    return [...this._cola_esperando_memoria];
  }

  private setColaListos(value: Proceso[]): void {
    this._cola_listos = value;
  }

  getColaListos(): Proceso[] {
    return [...this._cola_listos];
  }

  private setColaBloqueados(value: Proceso[]): void {
    this._cola_bloqueados = value;
  }

  getColaBloqueados(): Proceso[] {
    return [...this._cola_bloqueados];
  }

  private setProcesosTerminados(value: Proceso[]): void {
    this._procesos_terminados = value;
  }

  getProcesosTerminados(): Proceso[] {
    return [...this._procesos_terminados];
  }

  // Estado de CPU y estadísticas
  private setCpuProceso(value: Proceso | null): void {
    this._cpu_proceso = value;
  }

  getCpuProceso(): Proceso | null {
    return this._cpu_proceso;
  }

  private setRelojTick(value: number): void {
    this._reloj_tick = value;
  }

  getRelojTick(): number {
    return this._reloj_tick;
  }

  private setCambiosContexto(value: number): void {
    this._cambios_contexto = value;
  }

  getCambiosContexto(): number {
    return this._cambios_contexto;
  }

  private setTicksCpuOcupada(value: number): void {
    this._ticks_cpu_ocupada = value;
  }

  getTicksCpuOcupada(): number {
    return this._ticks_cpu_ocupada;
  }

  // Ingresa un nuevo proceso al sistema.
  agregarProceso(proceso: Proceso): void {
    proceso.setEstado("NUEVO");
    this.setColaNuevos([...this.getColaNuevos(), proceso]);
  }

  // Intenta ubicar el proceso en RAM según el algoritmo configurado.
  intentarAsignarMemoria(proceso: Proceso): boolean {
    switch (this.getAlgoritmoMemoria()) {
      case "FIRST_FIT":
        return this.getMemoria().asignarFirstFit(proceso);
      case "BEST_FIT":
        return this.getMemoria().asignarBestFit(proceso);
      case "WORST_FIT":
        return this.getMemoria().asignarWorstFit(proceso);
      default:
        return false;
    }
  }

  // Permite forzar el paso del proceso en CPU al estado Bloqueado por E/S.
  bloquearProcesoActual(ticksBloqueo: number = 2): void {
    const p = this.getCpuProceso();
    if (p === null) return;

    p.setEstado("BLOQUEADO");
    p.setTiempoBloqueoRestante(ticksBloqueo);
    this.setColaBloqueados([...this.getColaBloqueados(), p]);
    console.log(
      `   [E/S] Proceso ${p.getPid()} se bloquea por ${ticksBloqueo} ticks.`,
    );
    this.setCpuProceso(null);
    this.setCambiosContexto(this.getCambiosContexto() + 1);
  }

  // PASO A: Ingreso de procesos NUEVOS y reintento de ESPERANDO_MEMORIA.
  private admitirProcesos(): void {
    // Pasar de Nuevos a Esperando Memoria
    const esperando = this.getColaEsperandoMemoria();
    for (const p of this.getColaNuevos()) {
      p.setEstado("ESPERANDO_MEMORIA");
      esperando.push(p);
    }
    this.setColaNuevos([]);

    // Intentar alojar en RAM a los que esperan memoria
    const siguenEsperando: Proceso[] = [];
    for (const p of esperando) {
      if (this.intentarAsignarMemoria(p)) {
        p.setEstado("LISTO");
        this.setColaListos([...this.getColaListos(), p]);
        console.log(
          `   [MEMORIA] Proceso ${p.getPid()} obtuvo memoria. Pasa a LISTO.`,
        );
      } else {
        siguenEsperando.push(p);
      }
    }
    this.setColaEsperandoMemoria(siguenEsperando);
  }

  // PASO B: Actualizar cola de BLOQUEADOS (Entrada/Salida).
  private actualizarBloqueados(): void {
    const sigueBloqueados: Proceso[] = [];
    for (const p of this.getColaBloqueados()) {
      p.setTiempoBloqueoRestante(p.getTiempoBloqueoRestante() - 1);
      if (p.getTiempoBloqueoRestante() <= 0) {
        p.setEstado("LISTO");
        this.setColaListos([...this.getColaListos(), p]);
        console.log(
          `   [E/S COMPLETADA] Proceso ${p.getPid()} vuelve a cola de LISTOS.`,
        );
      } else {
        sigueBloqueados.push(p);
      }
    }
    this.setColaBloqueados(sigueBloqueados);
  }

  // PASO C: Despachar CPU si está desocupada (FIFO desde Listos).
  private despacharCpu(): void {
    const listos = this.getColaListos();
    if (this.getCpuProceso() !== null || listos.length === 0) return;

    const p = listos.shift() as Proceso;
    this.setColaListos(listos);
    p.setEstado("EJECUTANDO");
    p.setQuantumConsumido(0);
    this.setCpuProceso(p);
    console.log(`   [CPU] El proceso ${p.getPid()} toma el procesador.`);
  }

  // PASO D: Ejecución de 1 tick en CPU (Round-Robin).
  private ejecutarCpu(): void {
    const p = this.getCpuProceso();
    if (p === null) {
      console.log("   [CPU OCIOSA] Ningún proceso listo para ejecutar.");
      return;
    }

    this.setTicksCpuOcupada(this.getTicksCpuOcupada() + 1);
    p.setTiempoCpuRestante(p.getTiempoCpuRestante() - 1);
    p.setQuantumConsumido(p.getQuantumConsumido() + 1);

    console.log(
      `   [EJECUTANDO] PID: ${p.getPid()} | Restante: ${p.getTiempoCpuRestante()} ticks | ` +
        `Quantum: ${p.getQuantumConsumido()}/${this.getQuantumLimite()}`,
    );

    // Subcaso D1: El proceso TERMINÓ
    if (p.getTiempoCpuRestante() === 0) {
      p.setEstado("TERMINADO");
      console.log(
        `   [FINALIZADO] Proceso ${p.getPid()} finalizó. Libera memoria y CPU.`,
      );
      this.getMemoria().liberar(p.getPid());
      this.setProcesosTerminados([...this.getProcesosTerminados(), p]);
      this.setCpuProceso(null);
    }
    // Subcaso D2: Se agotó el QUANTUM
    else if (p.getQuantumConsumido() === this.getQuantumLimite()) {
      if (this.getColaListos().length > 0) {
        console.log(
          `   [FIN QUANTUM] ${p.getPid()} agotó Quantum. Vuelve al final de LISTOS.`,
        );
        p.setEstado("LISTO");
        p.setQuantumConsumido(0);
        this.setColaListos([...this.getColaListos(), p]);
        this.setCpuProceso(null);
        this.setCambiosContexto(this.getCambiosContexto() + 1);
      } else {
        // Si no hay nadie más en cola, renueva quantum y continúa
        console.log(
          `   [RENOVACIÓN] ${p.getPid()} continúa en CPU (cola de Listos vacía).`,
        );
        p.setQuantumConsumido(0);
      }
    }
  }

  // PASO E: Reporte de métricas del tick.
  private reportarMetricas(): void {
    const m = this.getMemoria().obtenerMetricas();
    const usoCpu = (this.getTicksCpuOcupada() / this.getRelojTick()) * 100;
    const pids = (cola: Proceso[]) =>
      `[${cola.map((p) => `'${p.getPid()}'`).join(", ")}]`;

    console.log("\n   --- MÉTRICAS EN TIEMPO REAL ---");
    console.log(
      `   Uso de CPU Acumulado: ${usoCpu.toFixed(2)}% | Cambios de Contexto: ${this.getCambiosContexto()}`,
    );
    console.log(
      `   Memoria Ocupada: ${m.ocupada} KB (${m.porcOcupacion.toFixed(1)}%) | Libre Total: ${m.libreTotal} KB`,
    );
    console.log(
      `   Mayor Hueco Contiguo: ${m.mayorHueco} KB | Fragmentación Externa: ${m.fragExterna.toFixed(2)}%`,
    );
    console.log(`   Cola de Listos: ${pids(this.getColaListos())}`);
    console.log(
      `   Esperando Memoria: ${pids(this.getColaEsperandoMemoria())}`,
    );
    this.getMemoria().imprimirMapa();
  }

  // Ejecuta un ciclo completo discreto (1 tick de simulación). */
  avanzarTick(): void {
    this.setRelojTick(this.getRelojTick() + 1);
    console.log(
      `\n${"=".repeat(25)} TICK ${this.getRelojTick()} ${"=".repeat(25)}`,
    );

    this.admitirProcesos(); // Paso A
    this.actualizarBloqueados(); // Paso B
    this.despacharCpu(); // Paso C
    this.ejecutarCpu(); // Paso D
    this.reportarMetricas(); // Paso E
  }
}
