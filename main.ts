export class Proceso {
    private _pid: string
    private _tamano_memoria: number
    private _tiempo_cpu_total: number
    private _tiempo_cpu_restante: number
    private _estado: "NUEVO" | "ESPERANDO_MEMORIA" | "LISTO" | "EJECUTANDO" | "BLOQUEADO" | "TERMINADO"
    private _quantum_consumido: number
    private _tiempo_bloqueo_restante: number

    constructor() {}

}