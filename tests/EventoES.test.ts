import { describe, it, expect } from "vitest";
import { EventoES } from "../src/procesos/EventoES";

describe("RF08 - EventoES", () => {
  it("guarda cuándo se dispara y cuánto dura", () => {
    const evento = new EventoES(2, 3);

    expect(evento.getCpuParaDisparar()).toBe(2);
    expect(evento.getDuracion()).toBe(3);
  });

  it("un evento con enteros positivos es válido", () => {
    expect(new EventoES(2, 3).esValido()).toBe(true);
  });

  it.each([0, -1, 1.5])("cpuParaDisparar = %d es inválido", (valor) => {
    expect(new EventoES(valor, 3).esValido()).toBe(false);
  });

  it.each([0, -2, 2.5])("duracion = %d es inválida", (valor) => {
    expect(new EventoES(1, valor).esValido()).toBe(false);
  });
});
