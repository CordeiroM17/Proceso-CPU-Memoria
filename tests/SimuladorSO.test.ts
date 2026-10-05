import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SimuladorSO } from "../src/simulador/SimuladorSO";
import { Proceso } from "../src/models/Proceso";

// El simulador imprime por consola: lo silenciamos
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

function correrTicks(sim: SimuladorSO, n: number): void {
  for (let i = 0; i < n; i++) sim.avanzarTick();
}

describe("SimuladorSO", () => {
  it("arranca en el tick 0 con CPU libre, colas vacías y memoria libre", () => {
    const sim = new SimuladorSO();

    expect(sim.getRelojTick()).toBe(0);
    expect(sim.getCpuProceso()).toBeNull();
    expect(sim.getColaListos()).toEqual([]);
    expect(sim.getMemoria().getBloques()).toHaveLength(1);
    expect(sim.getCambiosContexto()).toBe(0);
  });

  it("rechaza un quantum menor a 1", () => {
    expect(() => new SimuladorSO("FIRST_FIT", 0)).toThrow();
  });

  it.each(["FIRST_FIT", "BEST_FIT", "WORST_FIT"] as const)(
    "con %s asigna memoria y ejecuta un proceso",
    (algoritmo) => {
      const sim = new SimuladorSO(algoritmo);
      const p = new Proceso("P1", 200, 3);
      sim.agregarProceso(p);

      sim.avanzarTick();

      expect(sim.getCpuProceso()).toBe(p);
      expect(p.getTiempoCpuRestante()).toBe(2);
      expect(sim.getMemoria().obtenerMetricas().ocupada).toBe(200);
    },
  );

  it("el proceso que no entra espera y es admitido cuando se libera memoria", () => {
    const sim = new SimuladorSO();
    const grande = new Proceso("P1", 900, 1);
    const chico = new Proceso("P2", 200, 1);
    sim.agregarProceso(grande);
    sim.agregarProceso(chico);

    sim.avanzarTick();
    expect(chico.getEstado()).toBe("ESPERANDO_MEMORIA");

    sim.avanzarTick();
    expect(chico.getEstado()).toBe("TERMINADO");
  });

  it("Round Robin: al agotar el quantum cambia de proceso y cuenta un cambio de contexto", () => {
    const sim = new SimuladorSO("FIRST_FIT", 2);
    const p1 = new Proceso("P1", 100, 4);
    const p2 = new Proceso("P2", 100, 3);
    sim.agregarProceso(p1);
    sim.agregarProceso(p2);

    correrTicks(sim, 3);

    expect(sim.getCpuProceso()).toBe(p2);
    expect(sim.getColaListos()).toEqual([p1]);
    expect(sim.getCambiosContexto()).toBe(1);
  });

  it("un único proceso renueva el quantum sin cambio de contexto", () => {
    const sim = new SimuladorSO("FIRST_FIT", 2);
    sim.agregarProceso(new Proceso("P1", 100, 5));

    correrTicks(sim, 4);

    expect(sim.getCambiosContexto()).toBe(0);
  });

  it("al terminar todos, la memoria vuelve a ser un único bloque libre", () => {
    const sim = new SimuladorSO();
    sim.agregarProceso(new Proceso("P1", 300, 1));
    sim.agregarProceso(new Proceso("P2", 200, 2));

    correrTicks(sim, 5);

    expect(sim.getProcesosTerminados()).toHaveLength(2);
    expect(sim.getMemoria().getBloques()).toHaveLength(1);
    expect(sim.getMemoria().obtenerMetricas().libreTotal).toBe(1024);
  });

  it("bloquearProcesoActual libera la CPU y el proceso vuelve a Listos al terminar la E/S", () => {
    const sim = new SimuladorSO();
    const p = new Proceso("P1", 100, 5);
    sim.agregarProceso(p);
    sim.avanzarTick();

    sim.bloquearProcesoActual(1);
    expect(p.getEstado()).toBe("BLOQUEADO");
    expect(sim.getCpuProceso()).toBeNull();
    expect(sim.getCambiosContexto()).toBe(1);

    sim.avanzarTick();
    expect(p.getEstado()).toBe("EJECUTANDO");
  });

  it("bloquearProcesoActual no hace nada si la CPU está libre", () => {
    const sim = new SimuladorSO();
    sim.bloquearProcesoActual(2);

    expect(sim.getColaBloqueados()).toEqual([]);
  });

  it("un algoritmo desconocido no asigna memoria", () => {
    const sim = new SimuladorSO();
    sim.setAlgoritmoMemoria("OTRO" as never);

    expect(sim.intentarAsignarMemoria(new Proceso("P1", 100, 1))).toBe(false);
  });

  it("asignar memoria ocurre antes que liberarla dentro del mismo tick", () => {
    const sim = new SimuladorSO();
    const asignar = vi.spyOn(sim.getMemoria(), "asignarFirstFit");
    const liberar = vi.spyOn(sim.getMemoria(), "liberar");
    sim.agregarProceso(new Proceso("P1", 100, 1));

    sim.avanzarTick();

    expect(asignar.mock.invocationCallOrder[0]).toBeLessThan(
      liberar.mock.invocationCallOrder[0],
    );
  });
});
