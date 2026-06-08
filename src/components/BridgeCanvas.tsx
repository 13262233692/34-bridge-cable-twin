import { useEffect, useRef } from 'react'
import { BridgeScene } from '@/bridge/BridgeScene'
import { setScene } from '@/bridge/sceneManager'
import { useBridgeStore } from '@/store/bridgeStore'

const BRIDGE_PARAMS = {
  span: 200,
  towerHeight: 60,
  sag: 20,
  deckWidth: 16,
  deckY: 5,
  suspenderCount: 40,
}

export default function BridgeCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<BridgeScene | null>(null)
  const sensorReadings = useBridgeStore((s) => s.sensorReadings)

  useEffect(() => {
    if (!containerRef.current) return
    const scene = new BridgeScene(containerRef.current, BRIDGE_PARAMS)
    sceneRef.current = scene
    setScene(scene)
    return () => {
      scene.dispose()
      sceneRef.current = null
      setScene(null)
    }
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    for (const [id, reading] of sensorReadings) {
      const indexStr = id.replace('FBG-', '')
      const index = parseInt(indexStr, 10) - 1
      if (index >= 0 && index < BRIDGE_PARAMS.suspenderCount) {
        scene.updateSuspenderTension(index, reading.tensionRatio)
      }
    }
  }, [sensorReadings])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}
