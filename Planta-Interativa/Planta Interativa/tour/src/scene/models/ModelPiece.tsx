import { useGLTF } from '@react-three/drei'
import { Component, useMemo, type ReactNode } from 'react'
import { Box3, Mesh, Vector3, type Object3D } from 'three'
import { modelUrl, type ModelId } from '../assets'

export type Anchor = 'floor' | 'ceiling'

interface ModelPieceProps {
  readonly id: ModelId
  /** Uniformly rescale so the model's longest side on the floor (x or z) matches this length in metres. */
  readonly fitLength?: number
  /** Floor models stand on y = 0; ceiling models hang with their top at `ceiling`. */
  readonly anchor?: Anchor
  readonly ceiling?: number
  /** Rendered on the model's top surface, e.g. a vase on a table. */
  readonly children?: ReactNode
}

interface Prepared {
  readonly object: Object3D
  readonly scale: number
  readonly offset: Vector3
  readonly height: number
}

/** Clones the shared glTF scene, turns on shadows and works out how to centre it on its footprint. */
const prepare = (scene: Object3D, fitLength?: number): Prepared => {
  const object = scene.clone(true)
  object.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  const box = new Box3().setFromObject(object)
  const size = box.getSize(new Vector3())
  const scale = fitLength ? fitLength / Math.max(size.x, size.z) : 1
  const centre = box.getCenter(new Vector3())
  return { object, scale, offset: new Vector3(-centre.x, -box.min.y, -centre.z), height: size.y * scale }
}

/** A Poly Haven model at real-world scale, centred on its position and standing on the floor (or hung). */
export function ModelPiece({ id, fitLength, anchor = 'floor', ceiling = 0, children }: ModelPieceProps) {
  const { scene } = useGLTF(modelUrl(id))
  const { object, scale, offset, height } = useMemo(() => prepare(scene, fitLength), [scene, fitLength])
  const baseY = anchor === 'ceiling' ? ceiling - height : 0

  return (
    <group position={[0, baseY, 0]}>
      <group scale={scale}>
        <primitive object={object} position={offset} />
      </group>
      {children && <group position={[0, height, 0]}>{children}</group>}
    </group>
  )
}

interface BoundaryProps {
  readonly fallback: ReactNode
  readonly children: ReactNode
}

/** Shows a procedural stand-in if a model file is missing or broken, instead of blanking the scene. */
export class ModelBoundary extends Component<BoundaryProps, { hasFailed: boolean }> {
  state = { hasFailed: false }

  static getDerivedStateFromError() {
    return { hasFailed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('A 3D model failed to load; showing a simple stand-in instead.', error)
  }

  render() {
    return this.state.hasFailed ? this.props.fallback : this.props.children
  }
}
