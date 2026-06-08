import { useEffect, useRef, useCallback } from 'react'
import { useBridgeStore } from '@/store/bridgeStore'

interface WSMessage {
  type: string
  timestamp?: number
  sensors?: { id: string; microStrain: number; tensionRatio: number }[]
  connected?: boolean
  frequency?: number
  activeSensors?: number
}

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsTimeRef = useRef(Date.now())

  const setWsConnected = useBridgeStore((s) => s.setWsConnected)
  const setWsFrequency = useBridgeStore((s) => s.setWsFrequency)
  const updateSensorReadings = useBridgeStore((s) => s.updateSensorReadings)
  const setDataFrameRate = useBridgeStore((s) => s.setDataFrameRate)

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

          if (msg.type === 'sensor_data' && msg.sensors) {
            updateSensorReadings(msg.sensors)
            frameCountRef.current++

            const now = Date.now()
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
  }, [url, setWsConnected, setWsFrequency, updateSensorReadings, setDataFrameRate])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])
}
