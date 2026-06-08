import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { buildBridge, type BridgeMeshes, type BridgeParams } from './BridgeBuilder'

export class BridgeScene {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private meshes!: BridgeMeshes
  private clock: THREE.Clock
  private animationId: number = 0
  private container: HTMLElement
  private starField!: THREE.Points

  constructor(container: HTMLElement, params: BridgeParams) {
    this.container = container
    this.clock = new THREE.Clock()

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setClearColor(0x0a0e17)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.0015)

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      1,
      5000
    )
    this.camera.position.set(180, 80, 150)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 30, 0)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.maxDistance = 600
    this.controls.minDistance = 30
    this.controls.update()

    this.setupLighting()
    this.createStarField()
    this.meshes = buildBridge(params)
    this.scene.add(this.meshes.group)

    this.setupOcean()

    window.addEventListener('resize', this.onResize)
    this.animate()
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x1a2744, 0.8)
    this.scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xc8d8f0, 1.2)
    dirLight.position.set(100, 150, 80)
    dirLight.castShadow = false
    this.scene.add(dirLight)

    const fillLight = new THREE.DirectionalLight(0x4488cc, 0.4)
    fillLight.position.set(-80, 50, -60)
    this.scene.add(fillLight)

    const towerLight1 = new THREE.PointLight(0xff4444, 2, 60)
    towerLight1.position.set(-100, 68, 0)
    this.scene.add(towerLight1)

    const towerLight2 = new THREE.PointLight(0xff4444, 2, 60)
    towerLight2.position.set(100, 68, 0)
    this.scene.add(towerLight2)
  }

  private createStarField(): void {
    const count = 1500
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3000
      positions[i * 3 + 1] = Math.random() * 800 + 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3000
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: 0x8899bb, size: 0.8, sizeAttenuation: true })
    this.starField = new THREE.Points(geom, mat)
    this.scene.add(this.starField)
  }

  private setupOcean(): void {
    const oceanGeom = new THREE.PlaneGeometry(3000, 3000, 1, 1)
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x06101f,
      metalness: 0.9,
      roughness: 0.2,
      transparent: true,
      opacity: 0.85,
    })
    const ocean = new THREE.Mesh(oceanGeom, oceanMat)
    ocean.rotation.x = -Math.PI / 2
    ocean.position.y = -2
    this.scene.add(ocean)
  }

  updateSuspenderTension(index: number, tensionRatio: number): void {
    const mat = this.meshes.suspenderMaterials.get(index)
    if (mat) {
      mat.uniforms.uTensionRatio.value = tensionRatio
    }
  }

  private onResize = (): void => {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate)
    const elapsed = this.clock.getElapsedTime()

    for (const [, mat] of this.meshes.suspenderMaterials) {
      mat.uniforms.uTime.value = elapsed
    }

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  setCameraPreset(preset: 'overview' | 'side' | 'tower' | 'deck'): void {
    const targets: Record<string, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
      overview: { pos: new THREE.Vector3(180, 80, 150), target: new THREE.Vector3(0, 30, 0) },
      side: { pos: new THREE.Vector3(0, 40, 200), target: new THREE.Vector3(0, 30, 0) },
      tower: { pos: new THREE.Vector3(-95, 70, 20), target: new THREE.Vector3(-50, 30, 0) },
      deck: { pos: new THREE.Vector3(0, 8, 30), target: new THREE.Vector3(0, 5, 0) },
    }
    const t = targets[preset]
    if (!t) return

    this.camera.position.copy(t.pos)
    this.controls.target.copy(t.target)
    this.controls.update()
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize)
    cancelAnimationFrame(this.animationId)
    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
