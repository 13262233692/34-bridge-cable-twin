import { create } from 'zustand'

export interface SensorReading {
  id: string
  microStrain: number
  tensionRatio: number
}

interface BridgeState {
  wsConnected: boolean
  wsFrequency: number
  dataFrameRate: number
  selectedSensor: string | null
  uiReadings: SensorReading[]
  sensorHistory: Map<string, { time: number; value: number }[]>

  setWsConnected: (connected: boolean) => void
  setWsFrequency: (freq: number) => void
  setDataFrameRate: (rate: number) => void
  selectSensor: (id: string | null) => void
  updateUIReadings: (readings: SensorReading[]) => void
}

const MAX_HISTORY = 500

export const useBridgeStore = create<BridgeState>((set) => ({
  wsConnected: false,
  wsFrequency: 50,
  dataFrameRate: 0,
  selectedSensor: null,
  uiReadings: [],
  sensorHistory: new Map(),

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setWsFrequency: (freq) => set({ wsFrequency: freq }),
  setDataFrameRate: (rate) => set({ dataFrameRate: rate }),
  selectSensor: (id) => set({ selectedSensor: id }),

  updateUIReadings: (readings) =>
    set((state) => {
      const newHistory = new Map(state.sensorHistory)
      const now = Date.now()
      for (const r of readings) {
        const hist = newHistory.get(r.id)
        if (hist) {
          hist.push({ time: now, value: r.microStrain })
          if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY)
        } else {
          newHistory.set(r.id, [{ time: now, value: r.microStrain }])
        }
      }
      return { uiReadings: readings, sensorHistory: newHistory }
    }),
}))
