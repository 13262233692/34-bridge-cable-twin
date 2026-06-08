import { useBridgeStore } from '@/store/bridgeStore'
import { AlertTriangle, Activity, Waves } from 'lucide-react'

export default function ResonancePanel() {
  const modeAnalysis = useBridgeStore((s) => s.modeAnalysis)
  const mode1Amplitude = useBridgeStore((s) => s.mode1Amplitude)
  const mode2Amplitude = useBridgeStore((s) => s.mode2Amplitude)

  const activeMode = modeAnalysis?.activeMode ?? 'none'
  const isResonance = activeMode !== 'none'
  const mode1Ratio = modeAnalysis?.mode1VerticalRatio ?? 0
  const mode2Ratio = modeAnalysis?.mode2TorsionRatio ?? 0
  const dominantFreq = modeAnalysis?.dominantFreq ?? 0

  const spectrum = modeAnalysis?.spectrum
  const freqs = modeAnalysis?.freqs

  return (
    <div className="fixed bottom-10 left-4 w-72 bg-black/50 backdrop-blur-md border border-cyan-500/20 rounded-lg z-30 p-3">
      <div className="flex items-center gap-2 mb-2">
        {isResonance ? (
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
        ) : (
          <Waves className="w-4 h-4 text-cyan-400" />
        )}
        <span className={`text-xs font-mono ${isResonance ? 'text-red-400' : 'text-cyan-300/80'}`}>
          共振监测
        </span>
        {isResonance && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-mono bg-red-500/30 text-red-300 rounded animate-pulse">
            ALERT
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
        <div>
          <div className="text-cyan-500/50 text-[10px]">一阶竖弯</div>
          <div className={`tabular-nums ${mode1Ratio > 0.3 ? 'text-red-400' : 'text-cyan-300/70'}`}>
            {(mode1Ratio * 100).toFixed(1)}%
          </div>
          <div className="h-1 mt-0.5 bg-cyan-900/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(mode1Ratio * 100, 100)}%`,
                background: mode1Ratio > 0.3
                  ? 'linear-gradient(to right, #ff6644, #ff3344)'
                  : 'linear-gradient(to right, #00ff88, #00d4ff)',
              }}
            />
          </div>
        </div>
        <div>
          <div className="text-cyan-500/50 text-[10px]">二阶扭转</div>
          <div className={`tabular-nums ${mode2Ratio > 0.25 ? 'text-orange-400' : 'text-cyan-300/70'}`}>
            {(mode2Ratio * 100).toFixed(1)}%
          </div>
          <div className="h-1 mt-0.5 bg-cyan-900/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(mode2Ratio * 100, 100)}%`,
                background: mode2Ratio > 0.25
                  ? 'linear-gradient(to right, #ffaa00, #ff6600)'
                  : 'linear-gradient(to right, #00ff88, #00d4ff)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-cyan-500/50 mb-2">
        <div>形变振幅: <span className="text-cyan-300/70">{mode1Amplitude.toFixed(1)}</span></div>
        <div>扭转振幅: <span className="text-cyan-300/70">{mode2Amplitude.toFixed(1)}</span></div>
        <div>主频: <span className="text-cyan-300/70">{dominantFreq.toFixed(3)} Hz</span></div>
        <div>
          模态:
          <span className={`ml-1 ${activeMode === 'none' ? 'text-green-400' : 'text-red-400'}`}>
            {activeMode === 'none' ? '正常' : activeMode === 'vertical1' ? '竖弯共振' : '扭转共振'}
          </span>
        </div>
      </div>

      {spectrum && freqs && spectrum.length > 0 && (
        <div>
          <div className="text-cyan-500/50 text-[10px] mb-1 flex items-center gap-1">
            <Activity className="w-2.5 h-2.5" />
            频谱
          </div>
          <svg viewBox="0 0 250 40" className="w-full h-8 border border-cyan-500/10 rounded">
            {(() => {
              const displayBins = Math.min(spectrum.length, 50)
              const maxVal = Math.max(...Array.from(spectrum.slice(0, displayBins))) || 1
              const points: string[] = []
              for (let i = 0; i < displayBins; i++) {
                const x = (i / (displayBins - 1)) * 250
                const y = 38 - (spectrum[i] / maxVal) * 34
                points.push(`${x},${y}`)
              }
              return (
                <>
                  <polyline
                    points={points.join(' ')}
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth="1.2"
                    opacity="0.7"
                  />
                  {freqs.length > 0 && (
                    <>
                      <line
                        x1={(0.35 / (freqs[freqs.length - 1] || 1)) * 250}
                        y1="0"
                        x2={(0.35 / (freqs[freqs.length - 1] || 1)) * 250}
                        y2="40"
                        stroke="#ff4444"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                        opacity="0.5"
                      />
                      <line
                        x1={(0.70 / (freqs[freqs.length - 1] || 1)) * 250}
                        y1="0"
                        x2={(0.70 / (freqs[freqs.length - 1] || 1)) * 250}
                        y2="40"
                        stroke="#ffaa00"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                        opacity="0.5"
                      />
                    </>
                  )}
                </>
              )
            })()}
          </svg>
          <div className="flex justify-between text-[8px] text-cyan-500/30 mt-0.5 font-mono">
            <span>0 Hz</span>
            <span className="text-red-400/50">▼ 0.35Hz</span>
            <span className="text-orange-400/50">▼ 0.70Hz</span>
            <span>{freqs ? freqs[Math.min(49, freqs.length - 1)].toFixed(1) : ''} Hz</span>
          </div>
        </div>
      )}
    </div>
  )
}
