// ==============================================================================
// CASO DE PRUEBA Y EJECUCIÓN DEMOSTRATIVA
// ==============================================================================
import { SimuladorSO } from "./simulador/SimuladorSO";
import { Proceso } from "./models/Proceso";
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
