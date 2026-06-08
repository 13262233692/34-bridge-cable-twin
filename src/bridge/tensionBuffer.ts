const MAX_SUSPENDERS = 40
const INSTANCE_COUNT = MAX_SUSPENDERS * 2

const tensionBuffer = new Float32Array(INSTANCE_COUNT)
const microStrainBuffer = new Float32Array(MAX_SUSPENDERS)

export function setTensionRatio(suspenderIndex: number, ratio: number): void {
  if (suspenderIndex < 0 || suspenderIndex >= MAX_SUSPENDERS) return
  tensionBuffer[suspenderIndex] = ratio
  tensionBuffer[suspenderIndex + MAX_SUSPENDERS] = ratio
}

export function setMicroStrain(suspenderIndex: number, value: number): void {
  if (suspenderIndex < 0 || suspenderIndex >= MAX_SUSPENDERS) return
  microStrainBuffer[suspenderIndex] = value
}

export function getTensionBuffer(): Float32Array {
  return tensionBuffer
}

export function getMicroStrainBuffer(): Float32Array {
  return microStrainBuffer
}

export function getTensionRatio(index: number): number {
  return tensionBuffer[index] ?? 0
}

export function getMicroStrain(index: number): number {
  return microStrainBuffer[index] ?? 0
}

export { MAX_SUSPENDERS, INSTANCE_COUNT }
