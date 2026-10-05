// ==============================================================================
// SIMULADOR DISCRETO DE GESTIÓN DE MEMORIA Y PLANIFICACIÓN DE CPU
// Cátedra de Sistemas Operativos - Universidad de la Cuenca del Plata
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. ESTRUCTURAS DE DATOS (CLASES BASE)
// ------------------------------------------------------------------------------
import { EstadoProceso } from "../types/EstadoMemoria";
import { AlgoritmoMemoria } from "../types/AlgoritmoMemoria";
import { MetricasMemoria } from "../types/MetricasMemoria";
export class Proceso {
  private _pid: string; // Identificador único (ej: "P1")
  private _tamano_memoria: number; // Memoria requerida en KB
  private _tiempo_cpu_total: number; // Ticks totales que demanda la CPU
  private _tiempo_cpu_restante: number; // Ticks que le faltan para terminar
  private _estado: EstadoProceso = "NUEVO";
  private _quantum_consumido: number; // Ticks consecutivos que lleva en CPU en su turno
  private _tiempo_bloqueo_restante: number; // Ticks restantes que debe esperar en E/S

  constructor(pid: string, tamanoMemoria: number, tiempoCpuTotal: number) {
    this.setPid(pid);
    this.setTamanoMemoria(tamanoMemoria);
    this.setTiempoCpuTotal(tiempoCpuTotal);
    this.setTiempoCpuRestante(tiempoCpuTotal);
    this.setEstado("NUEVO");
    this.setQuantumConsumido(0);
    this.setTiempoBloqueoRestante(0);
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
}

export class BloqueMemoria {
  // Representa una partición contigua dentro del espacio total de la RAM.
  private _inicio: number = 0; // Dirección base en KB (ej: 0)
  private _tamano: number = 0; // Tamaño de la partición en KB
  private _libre: boolean = true; // true si está disponible, false si está ocupado
  private _pid: string | null = null; // PID del proceso que lo ocupa (o null si está libre)

  constructor(
    inicio: number,
    tamano: number,
    libre: boolean = true,
    pid: string | null = null,
  ) {
    this.setInicio(inicio);
    this.setTamano(tamano);
    this.setLibre(libre);
    this.setPid(pid);
  }

  protected setInicio(value: number): void {
    this._inicio = value;
  }

  getInicio(): number {
    return this._inicio;
  }

  setTamano(value: number): void {
    this._tamano = value;
  }

  getTamano(): number {
    return this._tamano;
  }

  setLibre(value: boolean): void {
    this._libre = value;
  }

  isLibre(): boolean {
    return this._libre;
  }

  setPid(value: string | null): void {
    this._pid = value;
  }

  getPid(): string | null {
    return this._pid;
  }

  getFin(): number {
    return this.getInicio() + this.getTamano();
  }
}

// ==============================================================================
// CASO DE PRUEBA Y EJECUCIÓN DEMOSTRATIVA
// ==============================================================================

console.log("INICIANDO SIMULADOR DISCRETO (SISTEMAS OPERATIVOS)...\n");

// Creamos el simulador con First-Fit y Quantum = 2
const simulador = new SimuladorSO("FIRST_FIT", 2);

// Creamos un lote de procesos representativos
// PID, Tamaño Memoria (KB), Tiempo de CPU (ticks)
const procesos = [
  new Proceso("P1", 200, 4),
  new Proceso("P2", 350, 3),
  new Proceso("P3", 150, 2),
  new Proceso("P4", 400, 3),
];

// Cargamos los procesos al simulador
for (const p of procesos) {
  simulador.agregarProceso(p);
}

// Avanzamos la simulación tick a tick por 12 ciclos
for (let i = 0; i < 12; i++) {
  simulador.avanzarTick();
}
