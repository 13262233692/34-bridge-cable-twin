export interface Accelerometer {
  id: string
  position: { x: number; z: number }
  sampleRate: number
}

export interface AccelerometerSample {
  id: string
  acceleration: number
}

function gaussRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function createAccelerometers(count: number, span: number, deckWidth: number): Accelerometer[] {
  const sensors: Accelerometer[] = [];
  const positionsPerRow = Math.ceil(count / 2);
  for (let i = 0; i < count; i++) {
    const row = i < positionsPerRow ? 0 : 1;
    const col = row === 0 ? i : i - positionsPerRow;
    const x = -span / 2 + (span / (positionsPerRow + 1)) * (col + 1);
    const z = row === 0 ? deckWidth / 4 : -deckWidth / 4;
    sensors.push({
      id: `ACC-${String(i + 1).padStart(3, '0')}`,
      position: { x, z },
      sampleRate: 200,
    });
  }
  return sensors;
}

const MODE1_FREQ = 0.35;
const MODE2_FREQ = 0.70;
const BASELINE_NOISE = 0.002;

let typhoonIntensity = 0;
let typhoonPhase = 0;

export function setTyphoonIntensity(intensity: number): void {
  typhoonIntensity = Math.max(0, Math.min(1, intensity));
}

export function getTyphoonIntensity(): number {
  return typhoonIntensity;
}

export function simulateAccelerometer(
  sensor: Accelerometer,
  t: number,
  span: number
): AccelerometerSample {
  const xNorm = (sensor.position.x + span / 2) / span;
  const zNorm = sensor.position.z;

  const mode1Shape = Math.sin(Math.PI * xNorm);
  const mode2Shape = Math.sin(2 * Math.PI * xNorm) * Math.sign(zNorm);

  const mode1Accel = mode1Shape * typhoonIntensity * 0.8 * Math.sin(2 * Math.PI * MODE1_FREQ * t + typhoonPhase);
  const mode2Accel = mode2Shape * typhoonIntensity * 0.5 * Math.sin(2 * Math.PI * MODE2_FREQ * t + typhoonPhase * 1.3);

  const noise = BASELINE_NOISE * gaussRandom();
  const ambient = 0.003 * Math.sin(2 * Math.PI * 1.2 * t + xNorm * 3);

  return {
    id: sensor.id,
    acceleration: Math.round((mode1Accel + mode2Accel + noise + ambient) * 100000) / 100000,
  };
}

export function cycleTyphoon(t: number): void {
  const cyclePeriod = 120;
  const phase = (t % cyclePeriod) / cyclePeriod;

  if (phase < 0.3) {
    typhoonIntensity = phase / 0.3;
  } else if (phase < 0.7) {
    typhoonIntensity = 1.0;
  } else {
    typhoonIntensity = (1 - phase) / 0.3;
  }
  typhoonIntensity = Math.max(0, Math.min(1, typhoonIntensity));
  typhoonPhase = t * 0.1;
}
