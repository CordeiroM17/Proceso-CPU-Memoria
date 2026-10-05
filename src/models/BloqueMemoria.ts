export class BloqueMemoria {
  // Representa una partición contigua dentro del espacio total de la RAM.
  private _inicio: number = 0; // Dirección base en KB (ej: 0)
  private _tamano: number = 0; // Tamaño de la partición en KB
  private _libre: boolean = true; // true si está disponible, false si está ocupado
  private _pid: string | null = null; // PID del proceso que lo ocupa (o null si está libre)

  constructor(
    inicio: number,
    tamano: number,
    libre: boolean = true,
    pid: string | null = null,
  ) {
    this.setInicio(inicio);
    this.setTamano(tamano);
    this.setLibre(libre);
    this.setPid(pid);
  }

  protected setInicio(value: number): void {
    this._inicio = value;
  }

  getInicio(): number {
    return this._inicio;
  }

  setTamano(value: number): void {
    this._tamano = value;
  }

  getTamano(): number {
    return this._tamano;
  }

  setLibre(value: boolean): void {
    this._libre = value;
  }

  isLibre(): boolean {
    return this._libre;
  }

  setPid(value: string | null): void {
    this._pid = value;
  }

  getPid(): string | null {
    return this._pid;
  }

  getFin(): number {
    return this.getInicio() + this.getTamano();
  }
}
