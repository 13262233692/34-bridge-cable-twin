export function solveCatenaryParam(span: number, sag: number): number {
  let a = span / 4
  for (let i = 0; i < 100; i++) {
    const f = a * (Math.cosh(span / (2 * a)) - 1) - sag
    const df = Math.cosh(span / (2 * a)) - 1 - (span / (2 * a)) * Math.sinh(span / (2 * a))
    const delta = f / df
    a -= delta
    if (Math.abs(delta) < 1e-10) break
  }
  return a
}

export function catenaryY(x: number, a: number): number {
  return a * (Math.cosh(x / a) - 1)
}
