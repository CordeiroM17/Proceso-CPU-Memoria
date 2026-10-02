// ==============================================================================
// SIMULADOR DISCRETO DE GESTIÓN DE MEMORIA Y PLANIFICACIÓN DE CPU
// Cátedra de Sistemas Operativos - Universidad de la Cuenca del Plata
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. ESTRUCTURAS DE DATOS (CLASES BASE)
// ------------------------------------------------------------------------------

// Estados: NUEVO, ESPERANDO_MEMORIA, LISTO, EJECUTANDO, BLOQUEADO, TERMINADO
export type EstadoProceso =
    | "NUEVO"
    | "ESPERANDO_MEMORIA"
    | "LISTO"
    | "EJECUTANDO"
    | "BLOQUEADO"
    | "TERMINADO"

export class Proceso {
    private _pid: string                     // Identificador único (ej: "P1")
    private _tamano_memoria: number          // Memoria requerida en KB
    private _tiempo_cpu_total: number        // Ticks totales que demanda la CPU
    private _tiempo_cpu_restante: number     // Ticks que le faltan para terminar
    private _estado: EstadoProceso = "NUEVO"
    private _quantum_consumido: number       // Ticks consecutivos que lleva en CPU en su turno
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

export class BloqueMemoria {
    // Representa una partición contigua dentro del espacio total de la RAM.
    private _inicio: number = 0          // Dirección base en KB (ej: 0)
    private _tamano: number = 0          // Tamaño de la partición en KB
    private _libre: boolean = true       // true si está disponible, false si está ocupado
    private _pid: string | null = null   // PID del proceso que lo ocupa (o null si está libre)

    constructor(inicio: number, tamano: number, libre: boolean = true, pid: string | null = null) {
        this.setInicio(inicio)
        this.setTamano(tamano)
        this.setLibre(libre)
        this.setPid(pid)
    }

    protected setInicio(value: number): void {
        this._inicio = value
    }

    getInicio(): number {
        return this._inicio
    }

    setTamano(value: number): void {
        this._tamano = value
    }

    getTamano(): number {
        return this._tamano
    }

    setLibre(value: boolean): void {
        this._libre = value
    }

    isLibre(): boolean {
        return this._libre
    }

    setPid(value: string | null): void {
        this._pid = value
    }

    getPid(): string | null {
        return this._pid
    }

    getFin(): number {
        return this.getInicio() + this.getTamano()
    }
}

// ==============================================================================
// ADMINISTRADOR DE MEMORIA (1024 KB, ASIGNACIONES Y COALESCENCIA)
// ==============================================================================

export type AlgoritmoMemoria = "FIRST_FIT" | "BEST_FIT" | "WORST_FIT"

export interface MetricasMemoria {
    ocupada: number
    libreTotal: number
    mayorHueco: number
    porcOcupacion: number
    fragExterna: number
}

export class AdministradorMemoria {
    private _tamano_total: number = 0 // Tamaño total de la RAM en KB
    private _bloques: BloqueMemoria[] = [] // Lista ordenada de particiones

    constructor(tamanoTotal: number = 1024) {
        this.setTamanoTotal(tamanoTotal)
        // Al iniciar, la memoria completa es un único bloque libre
        this.setBloques([new BloqueMemoria(0, tamanoTotal, true)])
    }

    protected setTamanoTotal(value: number): void {
        this._tamano_total = value
    }

    getTamanoTotal(): number {
        return this._tamano_total
    }

    private setBloques(value: BloqueMemoria[]): void {
        this._bloques = value
    }

    /* Devuelve una copia de la lista para que nadie de afuera la modifique */
    getBloques(): BloqueMemoria[] {
        return [...this._bloques]
    }

    /*
     Recorre la lista de particiones y fusiona bloques libres contiguos en uno solo.
     Esencial para reducir la fragmentación externa tras liberar memoria.
    */
    coalescencia(): void {
        const bloques = this.getBloques()
        let i = 0
        while (i < bloques.length - 1) {
            const actual = bloques[i]
            const siguiente = bloques[i + 1]

            // Si dos bloques contiguos están libres, se unen sumando sus capacidades
            if (actual.isLibre() && siguiente.isLibre()) {
                actual.setTamano(actual.getTamano() + siguiente.getTamano())
                bloques.splice(i + 1, 1) // Se remueve el bloque absorbido
                // No incrementamos 'i' porque el bloque actual creció
                // y podría volver a fusionarse con el que le sigue
            } else {
                i++
            }
        }
        this.setBloques(bloques)
    }

    // Función interna: divide el bloque libre si sobra espacio y lo marca ocupado.
    private partirYAsignar(indice: number, proceso: Proceso): void {
        const bloques = this.getBloques()
        const bloque = bloques[indice]
        const requerido = proceso.getTamanoMemoria()

        if (bloque.getTamano() > requerido) {
            const sobrante = bloque.getTamano() - requerido
            const nuevoBloqueLibre = new BloqueMemoria(bloque.getInicio() + requerido, sobrante, true, null)
            bloque.setTamano(requerido)
            bloques.splice(indice + 1, 0, nuevoBloqueLibre)
        }
        bloque.setLibre(false)
        bloque.setPid(proceso.getPid())
        this.setBloques(bloques)
    }

    // Busca el primer hueco libre donde quepa el proceso.
    asignarFirstFit(proceso: Proceso): boolean {
        const indice = this.getBloques().findIndex(
            (b) => b.isLibre() && b.getTamano() >= proceso.getTamanoMemoria()
        )
        if (indice === -1) return false
        this.partirYAsignar(indice, proceso)
        return true
    }

    // Busca el bloque libre que deje el menor desperdicio de espacio residual.
    asignarBestFit(proceso: Proceso): boolean {
        let mejorIdx: number | null = null
        let menorDesperdicio = Infinity

        this.getBloques().forEach((b, i) => {
            if (b.isLibre() && b.getTamano() >= proceso.getTamanoMemoria()) {
                const desperdicio = b.getTamano() - proceso.getTamanoMemoria()
                if (desperdicio < menorDesperdicio) {
                    menorDesperdicio = desperdicio
                    mejorIdx = i
                }
            }
        })

        if (mejorIdx === null) return false
        this.partirYAsignar(mejorIdx, proceso)
        return true
    }

    // Busca el bloque libre de mayor tamaño absoluto.
    asignarWorstFit(proceso: Proceso): boolean {
        let peorIdx: number | null = null
        let mayorTamano = -1

        this.getBloques().forEach((b, i) => {
            if (b.isLibre() && b.getTamano() >= proceso.getTamanoMemoria()) {
                if (b.getTamano() > mayorTamano) {
                    mayorTamano = b.getTamano()
                    peorIdx = i
                }
            }
        })

        if (peorIdx === null) return false
        this.partirYAsignar(peorIdx, proceso)
        return true
    }

    // Libera la memoria de un proceso y ejecuta la coalescencia automática.
    liberar(pid: string): boolean {
        const bloque = this.getBloques().find((b) => b.getPid() === pid)
        if (!bloque) return false
        bloque.setLibre(true)
        bloque.setPid(null)
        this.coalescencia()
        return true
    }

    //Calcula memoria libre, ocupada, mayor bloque contiguo y fragmentación externa.
    obtenerMetricas(): MetricasMemoria {
        const bloques = this.getBloques()
        const ocupada = bloques.filter((b) => !b.isLibre()).reduce((acc, b) => acc + b.getTamano(), 0)
        const huecosLibres = bloques.filter((b) => b.isLibre()).map((b) => b.getTamano())
        const libreTotal = huecosLibres.reduce((acc, t) => acc + t, 0)
        const mayorHueco = huecosLibres.length > 0 ? Math.max(...huecosLibres) : 0

        const porcOcupacion = (ocupada / this.getTamanoTotal()) * 100

        // Fórmula exigida por la cátedra para fragmentación externa
        const fragExterna = libreTotal > 0 ? (1.0 - mayorHueco / libreTotal) * 100.0 : 0.0

        return { ocupada, libreTotal, mayorHueco, porcOcupacion, fragExterna }
    }

    // Muestra la tabla de bloques en consola.
    imprimirMapa(): void {
        console.log("   [MAPA DE MEMORIA]")
        for (const b of this.getBloques()) {
            const estadoStr = b.isLibre() ? "LIBRE" : `OCUPADO por ${b.getPid()}`
            const inicio = String(b.getInicio()).padStart(4)
            const fin = String(b.getFin()).padStart(4)
            const tamano = String(b.getTamano()).padStart(4)
            console.log(`   [${inicio} KB - ${fin} KB] (${tamano} KB) -> ${estadoStr}`)
        }
    }
}

// ==============================================================================
// MOTOR DEL SIMULADOR (TICKS Y PLANIFICADOR ROUND-ROBIN)
// ==============================================================================

export class SimuladorSO {
    private _memoria: AdministradorMemoria = new AdministradorMemoria(1024)
    private _algoritmo_memoria: AlgoritmoMemoria = "FIRST_FIT" // FIRST_FIT, BEST_FIT o WORST_FIT
    private _quantum_limite: number = 2

    // Colas de procesos
    private _cola_nuevos: Proceso[] = []
    private _cola_esperando_memoria: Proceso[] = []
    private _cola_listos: Proceso[] = []
    private _cola_bloqueados: Proceso[] = []
    private _procesos_terminados: Proceso[] = []

    // Estado de CPU y estadísticas
    private _cpu_proceso: Proceso | null = null
    private _reloj_tick: number = 0
    private _cambios_contexto: number = 0
    private _ticks_cpu_ocupada: number = 0

    constructor(algoritmoMemoria: AlgoritmoMemoria = "FIRST_FIT", quantum: number = 2) {
        this.setMemoria(new AdministradorMemoria(1024))
        this.setAlgoritmoMemoria(algoritmoMemoria)
        this.setQuantumLimite(quantum)
    }

    // Configuración

    private setMemoria(value: AdministradorMemoria): void {
        this._memoria = value
    }

    getMemoria(): AdministradorMemoria {
        return this._memoria
    }

    setAlgoritmoMemoria(value: AlgoritmoMemoria): void {
        this._algoritmo_memoria = value
    }

    getAlgoritmoMemoria(): AlgoritmoMemoria {
        return this._algoritmo_memoria
    }

    setQuantumLimite(value: number): void {
        if (value < 1) throw new Error("El quantum debe ser al menos 1 tick")
        this._quantum_limite = value
    }

    getQuantumLimite(): number {
        return this._quantum_limite
    }

    // Colas (los getters devuelven copias, solo el simulador las modifica)

    private setColaNuevos(value: Proceso[]): void {
        this._cola_nuevos = value
    }

    getColaNuevos(): Proceso[] {
        return [...this._cola_nuevos]
    }

    private setColaEsperandoMemoria(value: Proceso[]): void {
        this._cola_esperando_memoria = value
    }

    getColaEsperandoMemoria(): Proceso[] {
        return [...this._cola_esperando_memoria]
    }

    private setColaListos(value: Proceso[]): void {
        this._cola_listos = value
    }

    getColaListos(): Proceso[] {
        return [...this._cola_listos]
    }

    private setColaBloqueados(value: Proceso[]): void {
        this._cola_bloqueados = value
    }

    getColaBloqueados(): Proceso[] {
        return [...this._cola_bloqueados]
    }

    private setProcesosTerminados(value: Proceso[]): void {
        this._procesos_terminados = value
    }

    getProcesosTerminados(): Proceso[] {
        return [...this._procesos_terminados]
    }

    // Estado de CPU y estadísticas

    private setCpuProceso(value: Proceso | null): void {
        this._cpu_proceso = value
    }

    getCpuProceso(): Proceso | null {
        return this._cpu_proceso
    }

    private setRelojTick(value: number): void {
        this._reloj_tick = value
    }

    getRelojTick(): number {
        return this._reloj_tick
    }

    private setCambiosContexto(value: number): void {
        this._cambios_contexto = value
    }

    getCambiosContexto(): number {
        return this._cambios_contexto
    }

    private setTicksCpuOcupada(value: number): void {
        this._ticks_cpu_ocupada = value
    }

    getTicksCpuOcupada(): number {
        return this._ticks_cpu_ocupada
    }

    // Ingresa un nuevo proceso al sistema.
    agregarProceso(proceso: Proceso): void {
        proceso.setEstado("NUEVO")
        this.setColaNuevos([...this.getColaNuevos(), proceso])
    }

    // Intenta ubicar el proceso en RAM según el algoritmo configurado.
    intentarAsignarMemoria(proceso: Proceso): boolean {
        switch (this.getAlgoritmoMemoria()) {
            case "FIRST_FIT":
                return this.getMemoria().asignarFirstFit(proceso)
            case "BEST_FIT":
                return this.getMemoria().asignarBestFit(proceso)
            case "WORST_FIT":
                return this.getMemoria().asignarWorstFit(proceso)
            default:
                return false
        }
    }

    // Permite forzar el paso del proceso en CPU al estado Bloqueado por E/S.
    bloquearProcesoActual(ticksBloqueo: number = 2): void {
        const p = this.getCpuProceso()
        if (p === null) return

        p.setEstado("BLOQUEADO")
        p.setTiempoBloqueoRestante(ticksBloqueo)
        this.setColaBloqueados([...this.getColaBloqueados(), p])
        console.log(`   [E/S] Proceso ${p.getPid()} se bloquea por ${ticksBloqueo} ticks.`)
        this.setCpuProceso(null)
        this.setCambiosContexto(this.getCambiosContexto() + 1)
    }
}