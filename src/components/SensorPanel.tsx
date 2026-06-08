import { useBridgeStore } from '@/store/bridgeStore'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function SensorPanel() {
  const sensorReadings = useBridgeStore((s) => s.sensorReadings)
  const selectedSensor = useBridgeStore((s) => s.selectedSensor)
  const selectSensor = useBridgeStore((s) => s.selectSensor)
  const sensorHistory = useBridgeStore((s) => s.sensorHistory)

  const readings = Array.from(sensorReadings.values()).sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  )

  const selectedReading = selectedSensor ? sensorReadings.get(selectedSensor) : null
  const selectedHist = selectedSensor ? sensorHistory.get(selectedSensor) : null

  return (
    <>
      <div className="fixed top-4 left-4 w-56 max-h-[calc(100vh-80px)] overflow-y-auto bg-black/50 backdrop-blur-md border border-cyan-500/20 rounded-lg z-30 custom-scrollbar">
        <div className="sticky top-0 bg-black/70 backdrop-blur-md px-3 py-2 border-b border-cyan-500/20">
          <div className="text-xs text-cyan-300/80 font-mono">传感器列表</div>
        </div>
        <div className="p-1">
          {readings.map((r) => {
            const isAlert = r.tensionRatio > 0.6
            const isWarn = r.tensionRatio > 0.3
            const isSelected = selectedSensor === r.id

            return (
              <button
                key={r.id}
                onClick={() => selectSensor(isSelected ? null : r.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono transition-all duration-150 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200'
                    : 'text-cyan-300/70 hover:bg-cyan-500/10'
                }`}
              >
                <span className="flex-shrink-0">
                  {isAlert ? (
                    <AlertTriangle className="w-3 h-3 text-red-400" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                  ) : (
                    <CheckCircle className="w-3 h-3 text-green-400" />
                  )}
                </span>
                <span className="flex-1 text-left">{r.id}</span>
                <span
                  className={`tabular-nums ${
                    isAlert
                      ? 'text-red-400'
                      : isWarn
                      ? 'text-yellow-400'
                      : 'text-green-400'
                  }`}
                >
                  {r.microStrain.toFixed(0)}
                </span>
                <span className="text-cyan-500/40 text-[10px]">με</span>
              </button>
            )
          })}
        </div>
      </div>

      {selectedSensor && selectedReading && (
        <div className="fixed top-4 left-[15.5rem] w-64 bg-black/50 backdrop-blur-md border border-cyan-500/20 rounded-lg z-30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-cyan-300/80 font-mono">{selectedSensor}</span>
            <button
              onClick={() => selectSensor(null)}
              className="text-cyan-500/60 hover:text-cyan-300 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
            <div>
              <div className="text-cyan-500/50 text-[10px]">微应变</div>
              <div className={`tabular-nums ${
                selectedReading.tensionRatio > 0.6 ? 'text-red-400' :
                selectedReading.tensionRatio > 0.3 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {selectedReading.microStrain.toFixed(2)} με
              </div>
            </div>
            <div>
              <div className="text-cyan-500/50 text-[10px]">张力比</div>
              <div className="tabular-nums text-cyan-200">
                {(selectedReading.tensionRatio * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {selectedHist && selectedHist.length > 1 && (
            <div>
              <div className="text-cyan-500/50 text-[10px] mb-1">时序曲线</div>
              <svg viewBox="0 0 220 60" className="w-full h-14 border border-cyan-500/10 rounded">
                {(() => {
                  const data = selectedHist.slice(-200)
                  const minV = Math.min(...data.map((d) => d.value))
                  const maxV = Math.max(...data.map((d) => d.value))
                  const range = maxV - minV || 1
                  const points = data.map((d, i) => {
                    const x = (i / (data.length - 1)) * 220
                    const y = 58 - ((d.value - minV) / range) * 54
                    return `${x},${y}`
                  })
                  return (
                    <polyline
                      points={points.join(' ')}
                      fill="none"
                      stroke="#00d4ff"
                      strokeWidth="1"
                      opacity="0.8"
                    />
                  )
                })()}
              </svg>
            </div>
          )}
        </div>
      )}
    </>
  )
}
