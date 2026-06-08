import type { BridgeScene } from './BridgeScene'

let instance: BridgeScene | null = null

export function setScene(scene: BridgeScene | null): void {
  instance = scene
}

export function getScene(): BridgeScene | null {
  return instance
}
