import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { createSensors, simulateReading, type FBGSensor, type SensorReading } from './fbgSimulator.js';

interface ClientState {
  ws: WebSocket;
  subscribedSensors: Set<string>;
}

export function setupWebSocket(server: Server, sensorCount: number): void {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const sensors = createSensors(sensorCount);
  const clients = new Map<WebSocket, ClientState>();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let frequency = 50;

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
      const readings: SensorReading[] = sensors.map((s) => simulateReading(s, t));

      broadcast({
        type: 'sensor_data',
        timestamp: Date.now(),
        sensors: readings,
      });
    }, intervalMs);
  }

  function stopStreaming(): void {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  wss.on('connection', (ws) => {
    const clientState: ClientState = {
      ws,
      subscribedSensors: new Set(sensors.map((s) => s.id)),
    };
    clients.set(ws, clientState);

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

export { type FBGSensor, type SensorReading };
