import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { createSensors, simulateReading, type SensorReading } from './fbgSimulator.js';
import {
  createAccelerometers,
  simulateAccelerometer,
  cycleTyphoon,
  type Accelerometer,
  type AccelerometerSample,
} from './accelerometerSimulator.js';

export function setupWebSocket(server: Server, sensorCount: number): void {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const sensors = createSensors(sensorCount);
  const accelerometers = createAccelerometers(10, 200, 16);
  const clients = new Map<WebSocket, {}>();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let frequency = 50;
  let accBuffer: AccelerometerSample[][] = [];
  const ACC_SAMPLE_RATE = 200;
  const ACC_BATCH_SIZE = 4;

  function broadcast(data: object): void {
    const payload = JSON.stringify(data);
    for (const [ws] of clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  function startStreaming(): void {
    if (intervalId) clearInterval(intervalId);
    const intervalMs = 1000 / frequency;
    const startTime = Date.now() / 1000;

    intervalId = setInterval(() => {
      const t = Date.now() / 1000 - startTime;

      cycleTyphoon(t);

      const readings: SensorReading[] = sensors.map((s) => simulateReading(s, t));

      const accReadings: AccelerometerSample[] = accelerometers.map((acc) =>
        simulateAccelerometer(acc, t, 200)
      );
      accBuffer.push(accReadings);

      const payload: Record<string, unknown> = {
        type: 'sensor_data',
        timestamp: Date.now(),
        sensors: readings,
      };

      if (accBuffer.length >= ACC_BATCH_SIZE) {
        payload.type = 'sensor_data';
        (payload as Record<string, unknown>).accelerometer = accBuffer;
        accBuffer = [];
      }

      broadcast(payload);
    }, intervalMs);
  }

  function stopStreaming(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  wss.on('connection', (ws) => {
    clients.set(ws, {});

    ws.send(
      JSON.stringify({
        type: 'status',
        connected: true,
        frequency,
        activeSensors: sensors.length,
      })
    );

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'set_frequency' && typeof msg.frequency === 'number') {
          frequency = Math.max(1, Math.min(100, msg.frequency));
          if (intervalId) startStreaming();
          broadcast({ type: 'status', connected: true, frequency, activeSensors: sensors.length });
        }
      } catch {}
    });

    ws.on('close', () => {
      clients.delete(ws);
      if (clients.size === 0) stopStreaming();
    });
  });

  wss.on('listening', () => {
    console.log(`WebSocket server ready (path: /ws, sensors: ${sensorCount}, freq: ${frequency}Hz)`);
  });

  startStreaming();
}
