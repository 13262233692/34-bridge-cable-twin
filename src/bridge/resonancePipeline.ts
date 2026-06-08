import { analyzeModes, type ModeAnalysis, type BridgeModalParams } from './fft'

const FFT_SIZE = 256
const ACC_SAMPLE_RATE = 200
const MODE_EXAGGERATION = 100

const MODAL_PARAMS: BridgeModalParams = {
  mode1Freq: 0.35,
  mode2Freq: 0.70,
  freqTolerance: 0.08,
}

const accBuffers: Map<string, Float64Array> = new Map()
const accWriteIndex: Map<string, number> = new Map()
let modeAnalysis: ModeAnalysis | null = null
let mode1Amplitude = 0
let mode2Amplitude = 0

export function ingestAccelerometerBatch(
  batch: { id: string; acceleration: number }[][]
): void {
  for (const frame of batch) {
    for (const sample of frame) {
      let buf = accBuffers.get(sample.id)
      let idx = accWriteIndex.get(sample.id)
      if (!buf) {
        buf = new Float64Array(FFT_SIZE)
        idx = 0
        accBuffers.set(sample.id, buf)
        accWriteIndex.set(sample.id, 0)
      }
      buf[idx!] = sample.acceleration
      accWriteIndex.set(sample.id, ((idx! + 1) % FFT_SIZE))
    }
  }
}

export function runFFTAnalysis(): void {
  let bestAnalysis: ModeAnalysis | null = null
  let bestMag = 0

  for (const [id, buf] of accBuffers) {
    const writeIdx = accWriteIndex.get(id) ?? 0
    const ordered = new Float64Array(FFT_SIZE)
    for (let i = 0; i < FFT_SIZE; i++) {
      ordered[i] = buf[(writeIdx + i) % FFT_SIZE]
    }

    const analysis = analyzeModes(ordered, ACC_SAMPLE_RATE, MODAL_PARAMS)
    if (analysis.dominantMag > bestMag) {
      bestMag = analysis.dominantMag
      bestAnalysis = analysis
    }
  }

  modeAnalysis = bestAnalysis

  if (bestAnalysis) {
    const m1 = bestAnalysis.mode1VerticalRatio * bestAnalysis.mode1VerticalMag * MODE_EXAGGERATION
    const m2 = bestAnalysis.mode2TorsionRatio * bestAnalysis.mode2TorsionMag * MODE_EXAGGERATION
    mode1Amplitude = Math.min(m1, 15)
    mode2Amplitude = Math.min(m2, 10)
  } else {
    mode1Amplitude = 0
    mode2Amplitude = 0
  }
}

export function getModeAmplitudes(): { mode1: number; mode2: number } {
  return { mode1: mode1Amplitude, mode2: mode2Amplitude }
}

export function getModeAnalysis(): ModeAnalysis | null {
  return modeAnalysis
}

export function getAccBufferForDisplay(): Float64Array | null {
  for (const [, buf] of accBuffers) {
    return buf
  }
  return null
}
