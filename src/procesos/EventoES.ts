import { esEnteroPositivo } from "../utils/validaciones";
import type { IEventoES } from "./IEventoES";

/** Valor inmutable: los setters son privados y solo se usan en el constructor. */
export class EventoES implements IEventoES {
  private _cpuParaDisparar: number = 0;
  private _duracion: number = 0;

  constructor(cpuParaDisparar: number, duracion: number) {
    this.setCpuParaDisparar(cpuParaDisparar);
    this.setDuracion(duracion);
  }

  private setCpuParaDisparar(value: number): void {
    this._cpuParaDisparar = value;
  }

  getCpuParaDisparar(): number {
    return this._cpuParaDisparar;
  }

  private setDuracion(value: number): void {
    this._duracion = value;
  }

  getDuracion(): number {
    return this._duracion;
  }

  /** RF08: un evento inválido lo rechaza el proceso que lo recibe. */
  esValido(): boolean {
    return (
      esEnteroPositivo(this.getCpuParaDisparar()) &&
      esEnteroPositivo(this.getDuracion())
    );
  }
}
