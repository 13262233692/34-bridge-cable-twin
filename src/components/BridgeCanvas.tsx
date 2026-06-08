import { useEffect, useRef } from 'react'
import { BridgeScene } from '@/bridge/BridgeScene'
import { setScene } from '@/bridge/sceneManager'

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

  useEffect(() => {
    if (!containerRef.current) return
    const scene = new BridgeScene(containerRef.current, BRIDGE_PARAMS)
    setScene(scene)
    return () => {
      scene.dispose()
      setScene(null)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}
