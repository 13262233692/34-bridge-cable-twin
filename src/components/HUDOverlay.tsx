import { useBridgeStore } from '@/store/bridgeStore'
import { Activity, Wifi, WifiOff, Clock } from 'lucide-react'
import { getScene } from '@/bridge/sceneManager'

function StatusBar() {
  const wsConnected = useBridgeStore((s) => s.wsConnected)
  const wsFrequency = useBridgeStore((s) => s.wsFrequency)
  const dataFrameRate = useBridgeStore((s) => s.dataFrameRate)

  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false })

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-black/60 backdrop-blur-md border-t border-cyan-500/20 flex items-center px-4 text-xs font-mono z-30">
      <div className="flex items-center gap-1.5">
        {wsConnected ? (
          <Wifi className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className={wsConnected ? 'text-green-400' : 'text-red-400'}>
          {wsConnected ? 'WS 已连接' : 'WS 断开'}
        </span>
      </div>
      <div className="mx-4 w-px h-4 bg-cyan-500/30" />
      <div className="flex items-center gap-1.5 text-cyan-300/80">
        <Activity className="w-3.5 h-3.5" />
        <span>{dataFrameRate} fps / {wsFrequency} Hz</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 text-cyan-300/60">
        <Clock className="w-3.5 h-3.5" />
        <span>{timeStr}</span>
      </div>
    </div>
  )
}

function TensionLegend() {
  return (
    <div className="fixed bottom-10 right-4 bg-black/50 backdrop-blur-md border border-cyan-500/20 rounded-lg p-3 z-30">
      <div className="text-xs text-cyan-300/80 mb-2 font-mono">张力色谱</div>
      <div className="w-40 h-3 rounded-full" style={{
        background: 'linear-gradient(to right, #00ff88, #ffd900, #ff3344)'
      }} />
      <div className="flex justify-between text-[10px] text-cyan-300/60 mt-1 font-mono">
        <span>安全</span>
        <span>预警</span>
        <span>危险</span>
      </div>
    </div>
  )
}

function CameraPresets() {
  const presets: { key: 'overview' | 'side' | 'tower' | 'deck'; label: string }[] = [
    { key: 'overview', label: '俯瞰' },
    { key: 'side', label: '侧视' },
    { key: 'tower', label: '塔顶' },
    { key: 'deck', label: '桥面' },
  ]

  return (
    <div className="fixed top-4 right-4 flex gap-2 z-30">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => {
            const scene = getScene()
            if (scene) scene.setCameraPreset(p.key)
          }}
          className="px-3 py-1.5 text-xs font-mono bg-black/50 backdrop-blur-md border border-cyan-500/30 rounded text-cyan-300/80 hover:bg-cyan-500/20 hover:text-cyan-200 transition-all duration-200"
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

export default function HUDOverlay() {
  return (
    <>
      <StatusBar />
      <TensionLegend />
      <CameraPresets />
    </>
  )
}
