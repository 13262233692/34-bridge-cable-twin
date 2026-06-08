export interface Complex {
  re: number
  im: number
}

export function fft(x: Float64Array): Complex[] {
  const N = x.length
  if (N === 1) return [{ re: x[0], im: 0 }]

  if (!isPowerOf2(N)) {
    return dft(x)
  }

  const even = new Float64Array(N / 2)
  const odd = new Float64Array(N / 2)
  for (let i = 0; i < N / 2; i++) {
    even[i] = x[2 * i]
    odd[i] = x[2 * i + 1]
  }

  const E = fft(even)
  const O = fft(odd)
  const X: Complex[] = new Array(N)

  for (let k = 0; k < N / 2; k++) {
    const angle = (-2 * Math.PI * k) / N
    const wk: Complex = { re: Math.cos(angle), im: Math.sin(angle) }
    const t: Complex = {
      re: wk.re * O[k].re - wk.im * O[k].im,
      im: wk.re * O[k].im + wk.im * O[k].re,
    }
    X[k] = { re: E[k].re + t.re, im: E[k].im + t.im }
    X[k + N / 2] = { re: E[k].re - t.re, im: E[k].im - t.im }
  }

  return X
}

function isPowerOf2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

function dft(x: Float64Array): Complex[] {
  const N = x.length
  const X: Complex[] = new Array(N)
  for (let k = 0; k < N; k++) {
    let re = 0, im = 0
    for (let n = 0; n < N; n++) {
      const angle = (-2 * Math.PI * k * n) / N
      re += x[n] * Math.cos(angle)
      im += x[n] * Math.sin(angle)
    }
    X[k] = { re, im }
  }
  return X
}

export function magnitudeSpectrum(X: Complex[]): Float64Array {
  return new Float64Array(X.map((c) => Math.sqrt(c.re * c.re + c.im * c.im)))
}

export function nextPowerOf2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

export interface ModeAnalysis {
  dominantFreq: number
  dominantMag: number
  mode1VerticalMag: number
  mode2TorsionMag: number
  mode1VerticalRatio: number
  mode2TorsionRatio: number
  activeMode: 'none' | 'vertical1' | 'torsion2'
  spectrum: Float64Array
  freqs: Float64Array
}

export interface BridgeModalParams {
  mode1Freq: number
  mode2Freq: number
  freqTolerance: number
}

const DEFAULT_MODAL: BridgeModalParams = {
  mode1Freq: 0.35,
  mode2Freq: 0.70,
  freqTolerance: 0.08,
}

export function analyzeModes(
  timeSeries: Float64Array,
  sampleRate: number,
  params: BridgeModalParams = DEFAULT_MODAL
): ModeAnalysis {
  const N = timeSeries.length
  const padded = new Float64Array(nextPowerOf2(N))
  padded.set(timeSeries)

  const X = fft(padded)
  const half = Math.floor(X.length / 2)
  const mag = magnitudeSpectrum(X)
  const freqs = new Float64Array(half)
  for (let i = 0; i < half; i++) {
    freqs[i] = (i * sampleRate) / X.length
  }

  let dominantIdx = 1
  let dominantMag = 0
  for (let i = 1; i < half; i++) {
    if (mag[i] > dominantMag) {
      dominantMag = mag[i]
      dominantIdx = i
    }
  }

  const mode1Mag = getBandEnergy(mag, freqs, params.mode1Freq, params.freqTolerance)
  const mode2Mag = getBandEnergy(mag, freqs, params.mode2Freq, params.freqTolerance)

  const totalEnergy = mag.reduce((s, v, i) => (i > 0 && i < half ? s + v * v : s), 0) || 1
  const mode1Ratio = (mode1Mag * mode1Mag) / totalEnergy
  const mode2Ratio = (mode2Mag * mode2Mag) / totalEnergy

  let activeMode: 'none' | 'vertical1' | 'torsion2' = 'none'
  if (mode1Ratio > 0.3) activeMode = 'vertical1'
  else if (mode2Ratio > 0.25) activeMode = 'torsion2'

  return {
    dominantFreq: freqs[dominantIdx],
    dominantMag,
    mode1VerticalMag: mode1Mag,
    mode2TorsionMag: mode2Mag,
    mode1VerticalRatio: mode1Ratio,
    mode2TorsionRatio: mode2Ratio,
    activeMode,
    spectrum: mag.slice(0, half),
    freqs,
  }
}

function getBandEnergy(
  mag: Float64Array,
  freqs: Float64Array,
  centerFreq: number,
  tolerance: number
): number {
  let maxMag = 0
  for (let i = 1; i < freqs.length; i++) {
    if (Math.abs(freqs[i] - centerFreq) <= tolerance) {
      if (mag[i] > maxMag) maxMag = mag[i]
    }
  }
  return maxMag
}
