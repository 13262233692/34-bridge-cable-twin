import * as THREE from 'three'
import { solveCatenaryParam, catenaryY } from './catenary'

export interface BridgeParams {
  span: number
  towerHeight: number
  sag: number
  deckWidth: number
  deckY: number
  suspenderCount: number
}

export interface BridgeMeshes {
  group: THREE.Group
  towers: THREE.Mesh[]
  mainCables: THREE.Mesh[]
  suspenders: THREE.Mesh[]
  deck: THREE.Mesh
  suspenderMaterials: Map<number, THREE.ShaderMaterial>
}

const TENSION_VERTEX_SHADER = `
  varying vec2 vUvCoord;
  varying vec3 vNormalVec;
  void main() {
    vUvCoord = uv;
    vNormalVec = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const TENSION_FRAGMENT_SHADER = `
  uniform float uTensionRatio;
  uniform float uTime;
  varying vec2 vUvCoord;
  varying vec3 vNormalVec;

  void main() {
    vec3 safeColor = vec3(0.0, 1.0, 0.53);
    vec3 warnColor = vec3(1.0, 0.85, 0.0);
    vec3 alertColor = vec3(1.0, 0.2, 0.27);

    float r = clamp(uTensionRatio, 0.0, 1.0);
    vec3 color;
    if (r < 0.5) {
      color = mix(safeColor, warnColor, r * 2.0);
    } else {
      color = mix(warnColor, alertColor, (r - 0.5) * 2.0);
    }

    float pulse = 1.0 + 0.18 * sin(uTime * 5.0) * step(0.6, r);

    float rim = 1.0 - max(0.0, dot(vNormalVec, vec3(0.0, 0.0, 1.0)));
    color += rim * 0.15;

    gl_FragColor = vec4(color * pulse, 1.0);
  }
`

export function createTensionMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: TENSION_VERTEX_SHADER,
    fragmentShader: TENSION_FRAGMENT_SHADER,
    uniforms: {
      uTensionRatio: { value: 0.0 },
      uTime: { value: 0.0 },
    },
  })
}

export function buildBridge(params: BridgeParams): BridgeMeshes {
  const { span, towerHeight, sag, deckWidth, deckY, suspenderCount } = params
  const group = new THREE.Group()
  const towers: THREE.Mesh[] = []
  const mainCables: THREE.Mesh[] = []
  const suspenders: THREE.Mesh[] = []
  const suspenderMaterials = new Map<number, THREE.ShaderMaterial>()

  const a = solveCatenaryParam(span, sag)

  const towerGeom = createTowerGeometry(towerHeight, 4, 6)
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.6, roughness: 0.4 })

  const leftTower = new THREE.Mesh(towerGeom, towerMat)
  leftTower.position.set(-span / 2, towerHeight / 2 + deckY, 0)
  group.add(leftTower)
  towers.push(leftTower)

  const rightTower = new THREE.Mesh(towerGeom, towerMat)
  rightTower.position.set(span / 2, towerHeight / 2 + deckY, 0)
  group.add(rightTower)
  towers.push(rightTower)

  const cablePoints: THREE.Vector3[] = []
  const cableSegments = 200
  for (let i = 0; i <= cableSegments; i++) {
    const x = -span / 2 + (span * i) / cableSegments
    const y = catenaryY(x, a) + deckY
    cablePoints.push(new THREE.Vector3(x, y, 0))
  }

  const cableCurve = new THREE.CatmullRomCurve3(cablePoints)
  const cableTubeGeom = new THREE.TubeGeometry(cableCurve, cableSegments, 0.5, 8, false)
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x718096, metalness: 0.8, roughness: 0.3 })

  const cableFront = new THREE.Mesh(cableTubeGeom, cableMat)
  cableFront.position.z = deckWidth / 2 - 1
  group.add(cableFront)
  mainCables.push(cableFront)

  const cableBack = new THREE.Mesh(cableTubeGeom.clone(), cableMat)
  cableBack.position.z = -(deckWidth / 2 - 1)
  group.add(cableBack)
  mainCables.push(cableBack)

  const suspenderStep = span / (suspenderCount + 1)
  for (let i = 0; i < suspenderCount; i++) {
    const x = -span / 2 + suspenderStep * (i + 1)
    const yCable = catenaryY(x, a) + deckY
    const length = yCable - deckY

    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, length, 0),
    ]
    const suspenderCurve = new THREE.CatmullRomCurve3(points)
    const suspenderGeom = new THREE.TubeGeometry(suspenderCurve, 2, 0.15, 6, false)

    const mat = createTensionMaterial()
    suspenderMaterials.set(i, mat)

    for (const zOff of [deckWidth / 2 - 1, -(deckWidth / 2 - 1)]) {
      const mesh = new THREE.Mesh(suspenderGeom.clone(), zOff > 0 ? mat : mat.clone())
      mesh.position.set(x, deckY, zOff)
      group.add(mesh)
      suspenders.push(mesh)
      if (zOff < 0) {
        suspenderMaterials.set(i + suspenderCount, mesh.material as THREE.ShaderMaterial)
      }
    }
  }

  const deckGeom = new THREE.BoxGeometry(span + 10, 1.5, deckWidth)
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, metalness: 0.3, roughness: 0.7 })
  const deck = new THREE.Mesh(deckGeom, deckMat)
  deck.position.set(0, deckY - 0.75, 0)
  group.add(deck)

  const sideRailGeom = new THREE.BoxGeometry(span + 10, 1.2, 0.3)
  const sideRailMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.4, roughness: 0.5 })
  for (const zOff of [deckWidth / 2, -deckWidth / 2]) {
    const rail = new THREE.Mesh(sideRailGeom, sideRailMat)
    rail.position.set(0, deckY + 0.6, zOff)
    group.add(rail)
  }

  return { group, towers, mainCables, suspenders, deck, suspenderMaterials }
}

function createTowerGeometry(height: number, widthBottom: number, widthTop: number): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  const hb = widthBottom / 2
  const ht = widthTop / 2
  shape.moveTo(-hb, 0)
  shape.lineTo(-ht, height)
  shape.lineTo(ht, height)
  shape.lineTo(hb, 0)
  shape.closePath()

  const extrudeSettings = { depth: 6, bevelEnabled: false }
  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings)
  geom.translate(0, 0, -3)
  return geom
}
