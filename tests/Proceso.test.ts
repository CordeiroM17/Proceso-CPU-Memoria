import { describe, it, expect } from "vitest";
import { Proceso } from "../src/models/Proceso";

describe("Proceso", () => {
  it("inicializa todos los datos del PCB en el constructor", () => {
    const p = new Proceso("P1", 200, 4);

    expect(p.getPid()).toBe("P1");
    expect(p.getTamanoMemoria()).toBe(200);
    expect(p.getTiempoCpuTotal()).toBe(4);
    expect(p.getTiempoCpuRestante()).toBe(4);
    expect(p.getEstado()).toBe("NUEVO");
    expect(p.getQuantumConsumido()).toBe(0);
    expect(p.getTiempoBloqueoRestante()).toBe(0);
  });

  it("el tiempo restante arranca igual al tiempo total", () => {
    const p = new Proceso("P2", 100, 7);
    expect(p.getTiempoCpuRestante()).toBe(p.getTiempoCpuTotal());
  });

  it("permite cambiar el estado", () => {
    const p = new Proceso("P1", 200, 4);
    p.setEstado("LISTO");
    expect(p.getEstado()).toBe("LISTO");
    p.setEstado("EJECUTANDO");
    expect(p.getEstado()).toBe("EJECUTANDO");
  });

  it("permite actualizar los contadores que maneja el simulador", () => {
    const p = new Proceso("P1", 200, 4);
    p.setTiempoCpuRestante(3);
    p.setQuantumConsumido(1);
    p.setTiempoBloqueoRestante(2);

    expect(p.getTiempoCpuRestante()).toBe(3);
    expect(p.getQuantumConsumido()).toBe(1);
    expect(p.getTiempoBloqueoRestante()).toBe(2);
  });

  it("cambiar el tiempo restante no modifica el tiempo total", () => {
    const p = new Proceso("P1", 200, 4);
    p.setTiempoCpuRestante(1);
    expect(p.getTiempoCpuTotal()).toBe(4);
  });
});

describe("evento de E/S", () => {
  it("por defecto no tiene E/S", () => {
    const p = new Proceso("P1", 100, 4);

    expect(p.getCpuParaEs()).toBe(0);
    expect(p.getDuracionEs()).toBe(0);
    expect(p.getEsDisparada()).toBe(false);
  });

  it("guarda los datos de la E/S recibidos en el constructor", () => {
    const p = new Proceso("P1", 100, 4, 2, 3);

    expect(p.getCpuParaEs()).toBe(2);
    expect(p.getDuracionEs()).toBe(3);
    expect(p.getEsDisparada()).toBe(false);
  });
});

describe("esValido", () => {
  it("acepta un proceso con datos correctos", () => {
    expect(new Proceso("P1", 100, 4).esValido()).toBe(true);
  });

  it("acepta un proceso con E/S coherente", () => {
    expect(new Proceso("P1", 100, 4, 2, 3).esValido()).toBe(true);
  });
});

describe("debeBloquearse", () => {
  it("es false si el proceso no tiene E/S", () => {
    expect(new Proceso("P1", 100, 4).debeBloquearse()).toBe(false);
  });

  it("es true cuando consumió exactamente la CPU que dispara la E/S", () => {
    const p = new Proceso("P1", 100, 4, 2, 3);
    expect(p.debeBloquearse()).toBe(false);

    p.setTiempoCpuRestante(3);
    expect(p.debeBloquearse()).toBe(false);

    p.setTiempoCpuRestante(2);
    expect(p.debeBloquearse()).toBe(true);
  });

  it("es false si la E/S ya se disparó", () => {
    const p = new Proceso("P1", 100, 4, 2, 3);
    p.setTiempoCpuRestante(2);
    p.setEsDisparada(true);
    expect(p.debeBloquearse()).toBe(false);
  });
});
