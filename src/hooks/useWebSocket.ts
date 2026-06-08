import { useEffect, useRef, useCallback } from 'react'
import { useBridgeStore } from '@/store/bridgeStore'
import { setTensionRatio, setMicroStrain, MAX_SUSPENDERS } from '@/bridge/tensionBuffer'
import { getScene } from '@/bridge/sceneManager'
import { ingestAccelerometerBatch, runFFTAnalysis, getModeAmplitudes, getModeAnalysis } from '@/bridge/resonancePipeline'

interface WSMessage {
  type: string
  timestamp?: number
  sensors?: { id: string; microStrain: number; tensionRatio: number }[]
  accelerometer?: { id: string; acceleration: number }[][]
  connected?: boolean
  frequency?: number
  activeSensors?: number
}

const UI_THROTTLE_MS = 200
const FFT_THROTTLE_MS = 500

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(Date.now())
  const lastUITimeRef = useRef(0)
  const lastFFTTimeRef = useRef(0)
  const latestReadingsRef = useRef<{ id: string; microStrain: number; tensionRatio: number }[]>([])

  const setWsConnected = useBridgeStore((s) => s.setWsConnected)
  const setWsFrequency = useBridgeStore((s) => s.setWsFrequency)
  const updateUIReadings = useBridgeStore((s) => s.updateUIReadings)
  const setDataFrameRate = useBridgeStore((s) => s.setDataFrameRate)
  const updateResonanceState = useBridgeStore((s) => s.updateResonanceState)

  const flushUI = useCallback(() => {
    updateUIReadings(latestReadingsRef.current)
  }, [updateUIReadings])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setWsConnected(true)
        frameCountRef.current = 0
        lastFpsTimeRef.current = Date.now()
      }

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)

          if (msg.type === 'sensor_data') {
            if (msg.sensors) {
              for (const s of msg.sensors) {
                const idx = parseInt(s.id.replace('FBG-', ''), 10) - 1
                if (idx >= 0 && idx < MAX_SUSPENDERS) {
                  setTensionRatio(idx, s.tensionRatio)
                  setMicroStrain(idx, s.microStrain)
                }
              }
              latestReadingsRef.current = msg.sensors
            }

            if (msg.accelerometer) {
              ingestAccelerometerBatch(msg.accelerometer)
            }

            const scene = getScene()
            if (scene) scene.markTensionDirty()

            const now = Date.now()

            if (now - lastUITimeRef.current >= UI_THROTTLE_MS) {
              lastUITimeRef.current = now
              flushUI()
            }

            if (now - lastFFTTimeRef.current >= FFT_THROTTLE_MS) {
              lastFFTTimeRef.current = now
              runFFTAnalysis()
              const amps = getModeAmplitudes()
              if (scene) scene.setDeckModeAmplitudes(amps.mode1, amps.mode2)
              const analysis = getModeAnalysis()
              updateResonanceState(analysis, amps.mode1, amps.mode2)
            }

            frameCountRef.current++
            const elapsed = now - lastFpsTimeRef.current
            if (elapsed >= 1000) {
              setDataFrameRate(Math.round((frameCountRef.current * 1000) / elapsed))
              frameCountRef.current = 0
              lastFpsTimeRef.current = now
            }
          }

          if (msg.type === 'status') {
            if (msg.connected !== undefined) setWsConnected(msg.connected)
            if (msg.frequency !== undefined) setWsFrequency(msg.frequency)
          }
        } catch {}
      }

      ws.onclose = () => {
        setWsConnected(false)
        reconnectTimer.current = setTimeout(() => connect(), 2000)
      }

      ws.onerror = () => {
        ws.close()
      }

      wsRef.current = ws
    } catch {
      reconnectTimer.current = setTimeout(() => connect(), 2000)
    }
  }, [url, setWsConnected, setWsFrequency, flushUI, setDataFrameRate, updateResonanceState])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])
}
