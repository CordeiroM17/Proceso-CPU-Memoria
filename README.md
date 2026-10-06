# Simulador de procesos y memoria de un Sistema Operativo

Trabajo AE2 — Paradigmas de Programación II.

Simulador discreto (por ticks) de un sistema operativo simplificado, escrito en **TypeScript** con **Vitest**. Combina:

- **Planificación de CPU Round-Robin** con quantum configurable.
- **Administración de memoria con particiones contiguas dinámicas**: asignación First-Fit, Best-Fit y Worst-Fit, liberación y coalescencia de huecos.
- **Métricas** de memoria (ocupación, mayor hueco, fragmentación externa) y de CPU (uso, cambios de contexto).

> Es una librería: no tiene `main` ni interfaz. Se usa desde código o desde los tests.

**Estudiante:** Cordeiro Mariano Angel

## Requisitos

- Node.js 24 (el mismo que usa el workflow de CI)
- npm

## Instalación y ejecución

```bash
npm ci               # instala dependencias exactas del package-lock.json
npm run typecheck    # verifica tipos (tsc --noEmit)
npm test             # corre las pruebas
npm run coverage     # pruebas + cobertura (falla si las líneas ≤ 91 %)
```

El reporte de cobertura se imprime en consola y se genera en `coverage/` (abrir `coverage/index.html`).

## Estructura

```
src/
  models/       Proceso, BloqueMemoria
  memoria/      AdministradorMemoria, IEstrategiaAsignacion,
                EstrategiaAsignacion (abstracta), FirstFit, BestFit, WorstFit
  simulador/    SimuladorSO (colas, reloj, Round-Robin, métricas)
  types/        AlgoritmoMemoria, EstadoProceso, MetricasMemoria, VistaProceso
  utils/        validaciones
tests/          pruebas unitarias y de colaboración (Vitest)
docs/           diagramas UML e informe técnico
.github/workflows/ci.yml   integración continua
```

## Uso básico

```ts
import { SimuladorSO } from "./src/simulador/SimuladorSO";
import { Proceso } from "./src/models/Proceso";

const sim = new SimuladorSO("BEST_FIT", 2); // algoritmo y quantum

// pid, tamaño de memoria (KB), tiempo total de CPU (ticks)
sim.agregarProceso(new Proceso("P1", 200, 4));
sim.agregarProceso(new Proceso("P2", 300, 3));

for (let i = 0; i < 10; i++) sim.avanzarTick();

console.log(sim.getProcesosTerminados().map((p) => p.getPid()));
console.log(sim.getMemoria().obtenerMetricas());
console.log(sim.getCambiosContexto(), sim.getTicksCpuOcupada());
```

Algoritmos disponibles: `"FIRST_FIT"`, `"BEST_FIT"`, `"WORST_FIT"`. La memoria total es de 1024 KB.

## Reglas de la simulación

**Estados:** `NUEVO → ESPERANDO_MEMORIA → LISTO → EJECUTANDO → TERMINADO`; desde `EJECUTANDO` se puede volver a `LISTO` (fin de quantum) o pasar a `BLOQUEADO` y volver a `LISTO`.

**Orden dentro de cada tick** (`avanzarTick`):

1. Se incrementa el reloj.
2. **A.** Admisión: los procesos nuevos pasan a esperar memoria y se reintenta asignarles RAM.
3. **B.** Se descuenta un tick a los bloqueados; los que terminan su E/S vuelven a Listos.
4. **C.** Si la CPU está libre, se despacha el primero de Listos (FIFO).
5. **D.** Se ejecuta un tick: termina (libera memoria), agota el quantum (vuelve al final de Listos) o renueva quantum si no hay otros Listos.
6. **E.** Reporte de métricas.

**Políticas de asignación** (en empate gana la dirección más baja):

| Política  | Elige                                         |
| --------- | --------------------------------------------- |
| First-Fit | el primer hueco (menor dirección) donde entra |
| Best-Fit  | el hueco más chico donde entra                |
| Worst-Fit | el hueco más grande                           |

**Fragmentación externa** = (1 − mayor hueco / memoria libre total) × 100.

**Cambios de contexto:** se cuentan cuando un proceso deja la CPU por quantum (habiendo otros Listos) o por bloqueo de E/S.

## Diseño (resumen)

- `IEstrategiaAsignacion` define el contrato de una política; `AdministradorMemoria.asignar(proceso, estrategia)` funciona con cualquiera (polimorfismo).
- `EstrategiaAsignacion` aplica el patrón **Template Method**: filtra los huecos candidatos y las subclases solo implementan `elegir`.
- Las operaciones que pueden fallar devuelven `boolean` en lugar de lanzar excepciones.
- Atributos privados con getters/setters; los datos inmutables tienen setters protegidos.

Los diagramas están en `docs/`: diagrama de clases y tres de secuencia (admisión y asignación de memoria, tick de Round-Robin, bloqueo y retorno por E/S), en versión legible (PNG) y editable.

## Pruebas y cobertura

- 4 archivos de prueba, 46 pruebas.
- Cobertura de líneas medida sobre **todo** `src/**/*.ts` (ver `vitest.config.ts`): **97,74 %**, con umbral mínimo configurado en 91 %.
- El workflow `ci.yml` ejecuta typecheck y cobertura en cada push y pull request.

## Limitaciones conocidas

- El código aún imprime por consola (`console.log` en `SimuladorSO` e `imprimirMapa` en `AdministradorMemoria`).
- La E/S no se dispara automáticamente: `Proceso.debeBloquearse()` existe, pero el motor solo bloquea con `bloquearProcesoActual()`.
- `agregarProceso` no valida duplicados ni procesos más grandes que la RAM, y la memoria total no es configurable desde `SimuladorSO`.
- Uso de CPU y cambios de contexto se calculan pero no se devuelven como objeto de métricas.
- `getVista()` y `copiar()` existen pero el motor no los usa; los getters de colas devuelven las listas reales.

Más detalle en el informe técnico (`docs/Informe_Tecnico_Simulador_SO.pdf`).
