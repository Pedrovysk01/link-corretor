import { useGLTF } from '@react-three/drei'
import { modelUrl, type ModelId } from '../assets'

/** Starts downloading the models while the rest of the scene is set up. */
export const preloadModels = (ids: readonly ModelId[]) => {
  for (const id of ids) useGLTF.preload(modelUrl(id))
}
