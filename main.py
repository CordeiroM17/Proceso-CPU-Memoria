# ==============================================================================
# SIMULADOR DISCRETO DE GESTIÓN DE MEMORIA Y PLANIFICACIÓN DE CPU
# Cátedra de Sistemas Operativos - Universidad de la Cuenca del Plata
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. ESTRUCTURAS DE DATOS (CLASES BASE)
# ------------------------------------------------------------------------------

class Proceso:
    """
    Representa el Bloque de Control de Proceso (PCB).
    Contiene la información de estado, requisitos y contadores de cada proceso.
    """
    def __init__(self, pid, tamano_memoria, tiempo_cpu_total):
        self.pid = pid                              # Identificador único (ej: "P1")
        self.tamano_memoria = tamano_memoria        # Memoria requerida en KB
        self.tiempo_cpu_total = tiempo_cpu_total    # Ticks totales que demanda la CPU
        self.tiempo_cpu_restante = tiempo_cpu_total # Ticks que le faltan para terminar
        
        # Estados: NUEVO, ESPERANDO_MEMORIA, LISTO, EJECUTANDO, BLOQUEADO, TERMINADO
        self.estado = "NUEVO"
        
        self.quantum_consumido = 0                  # Ticks consecutivos que lleva en CPU en su turno
        self.tiempo_bloqueo_restante = 0            # Ticks restantes que debe esperar en E/S


class BloqueMemoria:
    """
    Representa una partición contigua dentro del espacio total de la RAM.
    """
    def __init__(self, inicio, tamano, libre=True, pid=None):
        self.inicio = inicio                        # Dirección base en KB (ej: 0)
        self.tamano = tamano                        # Tamaño de la partición en KB
        self.libre = libre                          # True si está disponible, False si está ocupado
        self.pid = pid                              # PID del proceso que lo ocupa (o None si está libre)


# ------------------------------------------------------------------------------
# 2. ADMINISTRADOR DE MEMORIA (1024 KB, ASIGNACIONES Y COALESCENCIA)
# ------------------------------------------------------------------------------

class AdministradorMemoria:
    def __init__(self, tamano_total=1024):
        self.tamano_total = tamano_total
        # Al iniciar, la memoria completa es un único bloque libre
        self.bloques = [BloqueMemoria(inicio=0, tamano=tamano_total, libre=True)]

    def coalescencia(self):
        """
        Recorre la lista de particiones y fusiona bloques libres contiguos en uno solo.
        Esencial para reducir la fragmentación externa tras liberar memoria.
        """
        i = 0
        while i < len(self.bloques) - 1:
            actual = self.bloques[i]
            siguiente = self.bloques[i + 1]
            
            # Si dos bloques contiguos están libres, se unen sumando sus capacidades
            if actual.libre and siguiente.libre:
                actual.tamano += siguiente.tamano
                self.bloques.pop(i + 1)  # Se remueve el bloque duplicado
                # Nota: No incrementamos 'i' porque el bloque actual creció 
                # y podría volver a fusionarse con el que le sigue a la derecha
            else:
                i += 1

    def asignar_first_fit(self, proceso):
        """Busca el primer hueco libre donde quepa el proceso."""
        for i, bloque in enumerate(self.bloques):
            if bloque.libre and bloque.tamano >= proceso.tamano_memoria:
                self._partir_y_asignar(i, bloque, proceso)
                return True
        return False

    def asignar_best_fit(self, proceso):
        """Busca el bloque libre que deje el menor desperdicio de espacio residual."""
        mejor_idx = None
        menor_desperdicio = float('inf')

        for i, b in enumerate(self.bloques):
            if b.libre and b.tamano >= proceso.tamano_memoria:
                desperdicio = b.tamano - proceso.tamano_memoria
                if desperdicio < menor_desperdicio:
                    menor_desperdicio = desperdicio
                    mejor_idx = i

        if mejor_idx is not None:
            self._partir_y_asignar(mejor_idx, self.bloques[mejor_idx], proceso)
            return True
        return False

    def asignar_worst_fit(self, proceso):
        """Busca el bloque libre de mayor tamaño absoluto."""
        peor_idx = None
        mayor_tamano = -1

        for i, b in enumerate(self.bloques):
            if b.libre and b.tamano >= proceso.tamano_memoria:
                if b.tamano > mayor_tamano:
                    mayor_tamano = b.tamano
                    peor_idx = i

        if peor_idx is not None:
            self._partir_y_asignar(peor_idx, self.bloques[peor_idx], proceso)
            return True
        return False

    def _partir_y_asignar(self, indice, bloque, proceso):
        """Función interna: divide el bloque libre si sobra espacio y lo marca ocupado."""
        if bloque.tamano > proceso.tamano_memoria:
            sobrante = bloque.tamano - proceso.tamano_memoria
            nuevo_bloque_libre = BloqueMemoria(
                inicio=bloque.inicio + proceso.tamano_memoria,
                tamano=sobrante,
                libre=True,
                pid=None
            )
            bloque.tamano = proceso.tamano_memoria
            bloque.libre = False
            bloque.pid = proceso.pid
            self.bloques.insert(indice + 1, nuevo_bloque_libre)
        else:
            bloque.libre = False
            bloque.pid = proceso.pid

    def liberar(self, pid):
        """Libera la memoria de un proceso y ejecuta la coalescencia automática."""
        for b in self.bloques:
            if b.pid == pid:
                b.libre = True
                b.pid = None
                self.coalescencia()
                return True
        return False

    def obtener_metricas(self):
        """Calcula memoria libre, ocupada, mayor bloque contiguo y fragmentación externa."""
        memoria_ocupada = sum(b.tamano for b in self.bloques if not b.libre)
        memoria_libre_total = sum(b.tamano for b in self.bloques if b.libre)
        
        huecos_libres = [b.tamano for b in self.bloques if b.libre]
        mayor_hueco = max(huecos_libres) if huecos_libres else 0
        
        porcentaje_ocupacion = (memoria_ocupada / self.tamano_total) * 100
        
        # Fórmula exigida por la cátedra para fragmentación externa
        if memoria_libre_total > 0:
            frag_externa = (1.0 - (mayor_hueco / memoria_libre_total)) * 100.0
        else:
            frag_externa = 0.0

        return {
            "ocupada": memoria_ocupada,
            "libre_total": memoria_libre_total,
            "mayor_hueco": mayor_hueco,
            "porc_ocupacion": porcentaje_ocupacion,
            "frag_externa": frag_externa
        }

    def imprimir_mapa(self):
        """Muestra la tabla de bloques en consola."""
        print("   [MAPA DE MEMORIA]")
        for b in self.bloques:
            fin = b.inicio + b.tamano
            estado_str = f"OCUPADO por {b.pid}" if not b.libre else "LIBRE"
            print(f"   [{b.inicio:4d} KB - {fin:4d} KB] ({b.tamano:4d} KB) -> {estado_str}")


# ------------------------------------------------------------------------------
# 3. MOTOR DEL SIMULADOR (TICKS Y PLANIFICADOR ROUND-ROBIN)
# ------------------------------------------------------------------------------

class SimuladorSO:
    def __init__(self, algoritmo_memoria="FIRST_FIT", quantum=2):
        self.memoria = AdministradorMemoria(tamano_total=1024)
        self.algoritmo_memoria = algoritmo_memoria  # FIRST_FIT, BEST_FIT o WORST_FIT
        self.quantum_limite = quantum
        
        # Colas de procesos
        self.cola_nuevos = []
        self.cola_esperando_memoria = []
        self.cola_listos = []
        self.cola_bloqueados = []
        self.procesos_terminados = []
        
        # Estado de CPU y estadísticas
        self.cpu_proceso = None
        self.reloj_tick = 0
        self.cambios_contexto = 0
        self.ticks_cpu_ocupada = 0

    def agregar_proceso(self, proceso):
        """Ingresa un nuevo proceso al sistema."""
        proceso.estado = "NUEVO"
        self.cola_nuevos.append(proceso)

    def intentar_asignar_memoria(self, proceso):
        """Intenta ubicar el proceso en RAM según el algoritmo configurado."""
        if self.algoritmo_memoria == "FIRST_FIT":
            return self.memoria.asignar_first_fit(proceso)
        elif self.algoritmo_memoria == "BEST_FIT":
            return self.memoria.asignar_best_fit(proceso)
        elif self.algoritmo_memoria == "WORST_FIT":
            return self.memoria.asignar_worst_fit(proceso)
        return False

    def bloquear_proceso_actual(self, ticks_bloqueo=2):
        """Permite forzar el paso del proceso en CPU al estado Bloqueado por E/S."""
        if self.cpu_proceso is not None:
            p = self.cpu_proceso
            p.estado = "BLOQUEADO"
            p.tiempo_bloqueo_restante = ticks_bloqueo
            self.cola_bloqueados.append(p)
            print(f"   [E/S] Proceso {p.pid} se bloquea por {ticks_bloqueo} ticks.")
            self.cpu_proceso = None
            self.cambios_contexto += 1

    def avanzar_tick(self):
        """Ejecuta un ciclo completo discreto (1 Tick de simulación)."""
        self.reloj_tick += 1
        print(f"\n{'='*25} TICK {self.reloj_tick} {'='*25}")

        # ----------------------------------------------------------------------
        # PASO A: Ingreso de procesos NUEVOS y reintento de ESPERANDO MEMORIA
        # ----------------------------------------------------------------------
        # Pasar de Nuevos a Esperando Memoria
        while self.cola_nuevos:
            p = self.cola_nuevos.pop(0)
            p.estado = "ESPERANDO_MEMORIA"
            self.cola_esperando_memoria.append(p)

        # Intentar alojar en RAM a los que esperan memoria
        i = 0
        while i < len(self.cola_esperando_memoria):
            p = self.cola_esperando_memoria[i]
            if self.intentar_asignar_memoria(p):
                p.estado = "LISTO"
                self.cola_listos.append(p)
                self.cola_esperando_memoria.pop(i)
                print(f"   [MEMORIA] Proceso {p.pid} obtuvo memoria. Pasa a LISTO.")
            else:
                i += 1

        # ----------------------------------------------------------------------
        # PASO B: Actualizar cola de BLOQUEADOS (Entrada/Salida)
        # ----------------------------------------------------------------------
        j = 0
        while j < len(self.cola_bloqueados):
            p = self.cola_bloqueados[j]
            p.tiempo_bloqueo_restante -= 1
            if p.tiempo_bloqueo_restante <= 0:
                p.estado = "LISTO"
                self.cola_listos.append(p)
                self.cola_bloqueados.pop(j)
                print(f"   [E/S COMPLETADA] Proceso {p.pid} vuelve a cola de LISTOS.")
            else:
                j += 1

        # ----------------------------------------------------------------------
        # PASO C: Despachar CPU si está desocupada (FIFO desde Listos)
        # ----------------------------------------------------------------------
        if self.cpu_proceso is None and len(self.cola_listos) > 0:
            self.cpu_proceso = self.cola_listos.pop(0)
            self.cpu_proceso.estado = "EJECUTANDO"
            self.cpu_proceso.quantum_consumido = 0
            print(f"   [CPU] El proceso {self.cpu_proceso.pid} toma el procesador.")

        # ----------------------------------------------------------------------
        # PASO D: Ejecución de 1 Tick en CPU (Round-Robin)
        # ----------------------------------------------------------------------
        if self.cpu_proceso is not None:
            self.ticks_cpu_ocupada += 1
            p = self.cpu_proceso
            p.tiempo_cpu_restante -= 1
            p.quantum_consumido += 1

            print(f"   [EJECUTANDO] PID: {p.pid} | Restante: {p.tiempo_cpu_restante} ticks | Quantum: {p.quantum_consumido}/{self.quantum_limite}")

            # Subcaso D1: El proceso TERMINÓ
            if p.tiempo_cpu_restante == 0:
                p.estado = "TERMINADO"
                print(f"   [FINALIZADO] Proceso {p.pid} finalizó. Libera memoria y CPU.")
                self.memoria.liberar(p.pid)
                self.procesos_terminados.append(p)
                self.cpu_proceso = None

            # Subcaso D2: Se agotó el QUANTUM
            elif p.quantum_consumido == self.quantum_limite:
                if len(self.cola_listos) > 0:
                    print(f"   [FIN QUANTUM] {p.pid} agotó Quantum. Vuelve al final de LISTOS.")
                    p.estado = "LISTO"
                    p.quantum_consumido = 0
                    self.cola_listos.append(p)
                    self.cpu_proceso = None
                    self.cambios_contexto += 1
                else:
                    # Si no hay nadie más en cola, renueva quantum y continúa
                    print(f"   [RENOVACIÓN] {p.pid} continúa en CPU (cola de Listos vacía).")
                    p.quantum_consumido = 0
        else:
            print("   [CPU OCIOSA] Ningún proceso listo para ejecutar.")

        # ----------------------------------------------------------------------
        # PASO E: Reporte de Métricas del Tick
        # ----------------------------------------------------------------------
        m = self.memoria.obtener_metricas()
        uso_cpu = (self.ticks_cpu_ocupada / self.reloj_tick) * 100
        
        print("\n   --- MÉTRICAS EN TIEMPO REAL ---")
        print(f"   Uso de CPU Acumulado: {uso_cpu:.2f}% | Cambios de Contexto: {self.cambios_contexto}")
        print(f"   Memoria Ocupada: {m['ocupada']} KB ({m['porc_ocupacion']:.1f}%) | Libre Total: {m['libre_total']} KB")
        print(f"   Mayor Hueco Contiguo: {m['mayor_hueco']} KB | Fragmentación Externa: {m['frag_externa']:.2f}%")
        print(f"   Cola de Listos: {[proc.pid for proc in self.cola_listos]}")
        print(f"   Esperando Memoria: {[proc.pid for proc in self.cola_esperando_memoria]}")
        self.memoria.imprimir_mapa()


# ------------------------------------------------------------------------------
# 4. CASO DE PRUEBA Y EJECUCIÓN DEMOSTRATIVA
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    print("INICIANDO SIMULADOR DISCRETO (SISTEMAS OPERATIVOS)...\n")
    
    # Creamos el simulador con First-Fit y Quantum = 2
    simulador = SimuladorSO(algoritmo_memoria="FIRST_FIT", quantum=2)

    # Creamos un lote de procesos representativos
    # PID, Tamaño Memoria (KB), Tiempo de CPU (ticks)
    p1 = Proceso("P1", tamano_memoria=200, tiempo_cpu_total=4)
    p2 = Proceso("P2", tamano_memoria=350, tiempo_cpu_total=3)
    p3 = Proceso("P3", tamano_memoria=150, tiempo_cpu_total=2)
    p4 = Proceso("P4", tamano_memoria=400, tiempo_cpu_total=3)

    # Cargamos los procesos al simulador
    for p in [p1, p2, p3, p4]:
        simulador.agregar_proceso(p)

    # Avanzamos la simulación tick a tick por 12 ciclos
    for _ in range(12):
        simulador.avanzar_tick()