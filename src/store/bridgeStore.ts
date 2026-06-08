import { create } from 'zustand'

export interface SensorReading {
  id: string
  microStrain: number
  tensionRatio: number
}

export interface BridgeConfig {
  span: number
  towerHeight: number
  sag: number
  catenaryParam: number
  deckWidth: number
  deckY: number
  suspenderCount: number
  suspenderPositions: { index: number; x: number; yCable: number; yDeck: number; length: number }[]
}

interface BridgeState {
  bridgeConfig: BridgeConfig | null
  sensorReadings: Map<string, SensorReading>
  wsConnected: boolean
  wsFrequency: number
  dataFrameRate: number
  selectedSensor: string | null
  sensorHistory: Map<string, { time: number; value: number }[]>

  setBridgeConfig: (config: BridgeConfig) => void
  updateSensorReadings: (readings: SensorReading[]) => void
  setWsConnected: (connected: boolean) => void
  setWsFrequency: (freq: number) => void
  setDataFrameRate: (rate: number) => void
  selectSensor: (id: string | null) => void
}

const MAX_HISTORY = 500

export const useBridgeStore = create<BridgeState>((set) => ({
  bridgeConfig: null,
  sensorReadings: new Map(),
  wsConnected: false,
  wsFrequency: 50,
  dataFrameRate: 0,
  selectedSensor: null,
  sensorHistory: new Map(),

  setBridgeConfig: (config) => set({ bridgeConfig: config }),

  updateSensorReadings: (readings) =>
    set((state) => {
      const newMap = new Map(state.sensorReadings)
      const newHistory = new Map(state.sensorHistory)
      const now = Date.now()

      for (const r of readings) {
        newMap.set(r.id, r)
        const hist = newHistory.get(r.id) ?? []
        hist.push({ time: now, value: r.microStrain })
        if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY)
        newHistory.set(r.id, hist)
      }

      return { sensorReadings: newMap, sensorHistory: newHistory }
    }),

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsFrequency: (freq) => set({ wsFrequency: freq }),
  setDataFrameRate: (rate) => set({ dataFrameRate: rate }),
  selectSensor: (id) => set({ selectedSensor: id }),
}))
