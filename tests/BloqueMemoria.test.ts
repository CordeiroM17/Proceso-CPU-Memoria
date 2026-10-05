import { describe, it, expect } from "vitest";
import { BloqueMemoria } from "../src/models/BloqueMemoria";

describe("BloqueMemoria", () => {
  it("por defecto se crea libre y sin PID", () => {
    const b = new BloqueMemoria(0, 1024);

    expect(b.getInicio()).toBe(0);
    expect(b.getTamano()).toBe(1024);
    expect(b.isLibre()).toBe(true);
    expect(b.getPid()).toBeNull();
  });

  it("se puede crear ocupado por un proceso", () => {
    const b = new BloqueMemoria(100, 200, false, "P1");

    expect(b.isLibre()).toBe(false);
    expect(b.getPid()).toBe("P1");
  });

  it("getFin devuelve inicio + tamaño", () => {
    const b = new BloqueMemoria(100, 250);
    expect(b.getFin()).toBe(350);
  });

  it("getFin se actualiza si cambia el tamaño", () => {
    const b = new BloqueMemoria(100, 250);
    b.setTamano(50);
    expect(b.getFin()).toBe(150);
  });

  it("permite marcarlo ocupado y volver a liberarlo", () => {
    const b = new BloqueMemoria(0, 100);

    b.setLibre(false);
    b.setPid("P3");
    expect(b.isLibre()).toBe(false);
    expect(b.getPid()).toBe("P3");

    b.setLibre(true);
    b.setPid(null);
    expect(b.isLibre()).toBe(true);
    expect(b.getPid()).toBeNull();
  });

  it("copiar devuelve un bloque igual pero independiente", () => {
    const original = new BloqueMemoria(100, 200, false, "P1");
    const copia = original.copiar();

    expect(copia).not.toBe(original);
    expect([
      copia.getInicio(),
      copia.getTamano(),
      copia.isLibre(),
      copia.getPid(),
    ]).toEqual([100, 200, false, "P1"]);

    copia.setTamano(50);
    expect(original.getTamano()).toBe(200);
  });
});
