export interface FBGSensor {
  id: string;
  suspenderIndex: number;
  baseMicroStrain: number;
  amplitude1: number;
  freq1: number;
  amplitude2: number;
  freq2: number;
  noiseSigma: number;
  alertThreshold: number;
  safeThreshold: number;
}

export interface SensorReading {
  id: string;
  microStrain: number;
  tensionRatio: number;
}

function gaussRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function createSensors(count: number): FBGSensor[] {
  const sensors: FBGSensor[] = [];
  for (let i = 0; i < count; i++) {
    const centerRatio = Math.abs(i - count / 2) / (count / 2);
    sensors.push({
      id: `FBG-${String(i + 1).padStart(3, '0')}`,
      suspenderIndex: i,
      baseMicroStrain: 600 + centerRatio * 400,
      amplitude1: 50 + Math.random() * 80,
      freq1: 0.3 + Math.random() * 0.7,
      amplitude2: 20 + Math.random() * 40,
      freq2: 1.5 + Math.random() * 2.0,
      noiseSigma: 5 + Math.random() * 10,
      alertThreshold: 1200,
      safeThreshold: 800,
    });
  }
  return sensors;
}

export function simulateReading(sensor: FBGSensor, t: number): SensorReading {
  const microStrain =
    sensor.baseMicroStrain +
    sensor.amplitude1 * Math.sin(2 * Math.PI * sensor.freq1 * t) +
    sensor.amplitude2 * Math.sin(2 * Math.PI * sensor.freq2 * t) +
    sensor.noiseSigma * gaussRandom();

  const clampedStrain = Math.max(0, microStrain);
  const tensionRatio = Math.min(
    1,
    Math.max(0, (clampedStrain - sensor.safeThreshold) / (sensor.alertThreshold - sensor.safeThreshold))
  );

  return {
    id: sensor.id,
    microStrain: Math.round(clampedStrain * 100) / 100,
    tensionRatio: Math.round(tensionRatio * 10000) / 10000,
  };
}
