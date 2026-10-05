/** RF08: evento determinista de Entrada/Salida de un proceso. */
export interface IEventoES {
  /** Ticks de CPU que el proceso tiene que haber consumido para que se dispare. */
  getCpuParaDisparar(): number;
  /** Ticks que el proceso queda bloqueado. */
  getDuracion(): number;
  /** True si ambos valores son enteros positivos. */
  esValido(): boolean;
}
