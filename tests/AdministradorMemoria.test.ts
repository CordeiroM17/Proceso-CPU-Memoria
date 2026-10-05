import { describe, it, expect, vi, afterEach } from "vitest";
import { AdministradorMemoria } from "../src/memoria/AdministradorMemoria";
import { Proceso } from "../src/models/Proceso";

/**
 * Arma una memoria con tres huecos libres en este orden:
 *   250 KB en 50 | 400 KB en 350 | 224 KB en 800
 * Con un proceso de 200 KB cada algoritmo elige un hueco distinto:
 *   First-Fit -> 50, Best-Fit -> 800, Worst-Fit -> 350
 */
function memoriaConHuecos(): AdministradorMemoria {
  const mem = new AdministradorMemoria(1024);
  mem.asignarFirstFit(new Proceso("A", 50, 1)); //   0 -  50
  mem.asignarFirstFit(new Proceso("B", 250, 1)); //  50 - 300
  mem.asignarFirstFit(new Proceso("C", 50, 1)); // 300 - 350
  mem.asignarFirstFit(new Proceso("D", 400, 1)); // 350 - 750
  mem.asignarFirstFit(new Proceso("E", 50, 1)); // 750 - 800 (queda libre 800 - 1024)
  mem.liberar("B");
  mem.liberar("D");
  return mem;
}

function inicioDe(mem: AdministradorMemoria, pid: string): number | undefined {
  return mem
    .getBloques()
    .find((b) => b.getPid() === pid)
    ?.getInicio();
}

describe("AdministradorMemoria", () => {
  describe("constructor y encapsulamiento", () => {
    it("arranca con un único bloque libre del tamaño total", () => {
      const mem = new AdministradorMemoria(1024);
      const bloques = mem.getBloques();

      expect(mem.getTamanoTotal()).toBe(1024);
      expect(bloques).toHaveLength(1);
      expect(bloques[0].getInicio()).toBe(0);
      expect(bloques[0].getTamano()).toBe(1024);
      expect(bloques[0].isLibre()).toBe(true);
    });

    it("usa 1024 KB si no se indica tamaño", () => {
      expect(new AdministradorMemoria().getTamanoTotal()).toBe(1024);
    });
  });

  describe("First-Fit", () => {
    it("asigna desde el inicio y parte el bloque sobrante", () => {
      const mem = new AdministradorMemoria(1024);

      expect(mem.asignarFirstFit(new Proceso("P1", 200, 1))).toBe(true);

      const [ocupado, libre] = mem.getBloques();
      expect(ocupado.getPid()).toBe("P1");
      expect(ocupado.getTamano()).toBe(200);
      expect(libre.getInicio()).toBe(200);
      expect(libre.getTamano()).toBe(824);
      expect(libre.isLibre()).toBe(true);
    });

    it("no parte el bloque si el proceso ocupa el tamaño exacto", () => {
      const mem = new AdministradorMemoria(1024);
      mem.asignarFirstFit(new Proceso("P1", 1024, 1));

      expect(mem.getBloques()).toHaveLength(1);
      expect(mem.getBloques()[0].getPid()).toBe("P1");
    });

    it("devuelve false si el proceso no entra", () => {
      const mem = new AdministradorMemoria(1024);
      expect(mem.asignarFirstFit(new Proceso("P1", 2000, 1))).toBe(false);
      expect(mem.getBloques()).toHaveLength(1);
    });

    it("elige el primer hueco donde entra", () => {
      const mem = memoriaConHuecos();
      mem.asignarFirstFit(new Proceso("X", 200, 1));
      expect(inicioDe(mem, "X")).toBe(50);
    });
  });

  describe("Best-Fit", () => {
    it("elige el hueco que deja menos desperdicio", () => {
      const mem = memoriaConHuecos();
      expect(mem.asignarBestFit(new Proceso("X", 200, 1))).toBe(true);
      expect(inicioDe(mem, "X")).toBe(800);
    });

    it("devuelve false si ningún hueco alcanza", () => {
      const mem = memoriaConHuecos();
      expect(mem.asignarBestFit(new Proceso("X", 500, 1))).toBe(false);
    });
  });

  describe("Worst-Fit", () => {
    it("elige el hueco más grande", () => {
      const mem = memoriaConHuecos();
      expect(mem.asignarWorstFit(new Proceso("X", 200, 1))).toBe(true);
      expect(inicioDe(mem, "X")).toBe(350);
    });

    it("devuelve false si ningún hueco alcanza", () => {
      const mem = memoriaConHuecos();
      expect(mem.asignarWorstFit(new Proceso("X", 500, 1))).toBe(false);
    });
  });

  describe("liberar y coalescencia", () => {
    it("devuelve false si el PID no está en memoria", () => {
      const mem = new AdministradorMemoria(1024);
      expect(mem.liberar("NO_EXISTE")).toBe(false);
    });

    it("libera el bloque del proceso", () => {
      const mem = new AdministradorMemoria(1024);
      mem.asignarFirstFit(new Proceso("P1", 200, 1));
      mem.asignarFirstFit(new Proceso("P2", 200, 1));

      expect(mem.liberar("P1")).toBe(true);
      const primero = mem.getBloques()[0];
      expect(primero.isLibre()).toBe(true);
      expect(primero.getPid()).toBeNull();
    });

    it("no fusiona huecos que no son contiguos", () => {
      const mem = memoriaConHuecos();
      const libres = mem.getBloques().filter((b) => b.isLibre());
      expect(libres.map((b) => b.getTamano())).toEqual([250, 400, 224]);
    });
  });

  describe("obtenerMetricas", () => {
    it("memoria vacía: todo libre y sin fragmentación", () => {
      const m = new AdministradorMemoria(1024).obtenerMetricas();
      expect(m).toEqual({
        ocupada: 0,
        libreTotal: 1024,
        mayorHueco: 1024,
        porcOcupacion: 0,
        fragExterna: 0,
      });
    });

    it("memoria llena: 100% ocupada y fragmentación 0", () => {
      const mem = new AdministradorMemoria(1024);
      mem.asignarFirstFit(new Proceso("P1", 1024, 1));
      const m = mem.obtenerMetricas();

      expect(m.ocupada).toBe(1024);
      expect(m.libreTotal).toBe(0);
      expect(m.mayorHueco).toBe(0);
      expect(m.porcOcupacion).toBe(100);
      expect(m.fragExterna).toBe(0);
    });
  });

  describe("imprimirMapa", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("imprime cada bloque con el formato del simulador", () => {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const mem = new AdministradorMemoria(1024);
      mem.asignarFirstFit(new Proceso("P1", 200, 1));

      mem.imprimirMapa();

      expect(log).toHaveBeenNthCalledWith(1, "   [MAPA DE MEMORIA]");
      expect(log).toHaveBeenNthCalledWith(
        2,
        "   [   0 KB -  200 KB] ( 200 KB) -> OCUPADO por P1",
      );
      expect(log).toHaveBeenNthCalledWith(
        3,
        "   [ 200 KB - 1024 KB] ( 824 KB) -> LIBRE",
      );
    });
  });
});
