export interface CatenaryParams {
  span: number;
  sag: number;
  a: number;
}

export function solveCatenaryParam(span: number, sag: number): number {
  let a = span / 4;
  for (let i = 0; i < 100; i++) {
    const f = a * (Math.cosh(span / (2 * a)) - 1) - sag;
    const df = Math.cosh(span / (2 * a)) - 1 - (span / (2 * a)) * Math.sinh(span / (2 * a));
    const delta = f / df;
    a -= delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  return a;
}

export function catenaryY(x: number, a: number): number {
  return a * (Math.cosh(x / a) - 1);
}

export function getCatenaryParams(span: number, sag: number): CatenaryParams {
  const a = solveCatenaryParam(span, sag);
  return { span, sag, a };
}

export interface SuspenderPosition {
  index: number;
  x: number;
  yCable: number;
  yDeck: number;
  length: number;
}

export function computeSuspenderPositions(
  span: number,
  sag: number,
  towerHeight: number,
  deckY: number,
  count: number
): SuspenderPosition[] {
  const a = solveCatenaryParam(span, sag);
  const positions: SuspenderPosition[] = [];
  const step = span / (count + 1);
  for (let i = 1; i <= count; i++) {
    const x = -span / 2 + step * i;
    const yCable = catenaryY(x, a);
    const length = yCable - deckY;
    positions.push({
      index: i,
      x,
      yCable,
      yDeck: deckY,
      length: Math.max(0.1, length),
    });
  }
  return positions;
}
