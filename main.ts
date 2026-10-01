export type EstadoProceso =
    | "NUEVO"
    | "ESPERANDO_MEMORIA"
    | "LISTO"
    | "EJECUTANDO"
    | "BLOQUEADO"
    | "TERMINADO"

export class Proceso {
    private _pid: string // Identificador único (ej: "P1")
    private _tamano_memoria: number // Memoria requerida en KB
    private _tiempo_cpu_total: number // Ticks totales que demanda la CPU
    private _tiempo_cpu_restante: number // Ticks que le faltan para terminar
    private _estado: EstadoProceso = "NUEVO"
    private _quantum_consumido: number // Ticks consecutivos que lleva en CPU en su turno
    private _tiempo_bloqueo_restante: number // Ticks restantes que debe esperar en E/S

    constructor(pid: string, tamanoMemoria: number, tiempoCpuTotal: number) {
        this.setPid(pid)
        this.setTamanoMemoria(tamanoMemoria)
        this.setTiempoCpuTotal(tiempoCpuTotal)
        this.setTiempoCpuRestante(tiempoCpuTotal)
        this.setEstado("NUEVO")
        this.setQuantumConsumido(0)
        this.setTiempoBloqueoRestante(0)
    }

    protected setPid(value: string): void {
        this._pid = value
    }

    getPid(): string {
        return this._pid
    }

    protected setTamanoMemoria(value: number): void {
        this._tamano_memoria = value
    }

    getTamanoMemoria(): number {
        return this._tamano_memoria
    }

    protected setTiempoCpuTotal(value: number): void {
        this._tiempo_cpu_total = value
    }

    getTiempoCpuTotal(): number {
        return this._tiempo_cpu_total
    }

    setTiempoCpuRestante(value: number): void {
        this._tiempo_cpu_restante = value
    }

    getTiempoCpuRestante(): number {
        return this._tiempo_cpu_restante
    }

    setEstado(value: EstadoProceso): void {
        this._estado = value
    }

    getEstado(): EstadoProceso {
        return this._estado
    }

    setQuantumConsumido(value: number): void {
        this._quantum_consumido = value
    }

    getQuantumConsumido(): number {
        return this._quantum_consumido
    }

    setTiempoBloqueoRestante(value: number): void {
        this._tiempo_bloqueo_restante = value
    }

    getTiempoBloqueoRestante(): number {
        return this._tiempo_bloqueo_restante
    }
}