import BridgeCanvas from '@/components/BridgeCanvas'
import HUDOverlay from '@/components/HUDOverlay'
import SensorPanel from '@/components/SensorPanel'
import { useWebSocket } from '@/hooks/useWebSocket'

const WS_URL = `ws://${window.location.hostname}:3001/ws`

export default function Home() {
  useWebSocket(WS_URL)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0e17]">
      <BridgeCanvas />
      <SensorPanel />
      <HUDOverlay />

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="text-center">
          <h1 className="text-sm font-mono tracking-[0.3em] text-cyan-300/70 uppercase">
            跨海大桥结构健康监测
          </h1>
          <p className="text-[10px] font-mono text-cyan-500/40 mt-0.5">
            Structural Health Monitoring · Digital Twin
          </p>
        </div>
      </div>
    </div>
  )
}
