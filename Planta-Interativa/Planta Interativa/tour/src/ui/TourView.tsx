import { useProgress } from '@react-three/drei'
import { lazy, Suspense, useState } from 'react'
import { isWebGLAvailable } from '../lib/webgl'
import { useActiveRoom, useProperty } from '../state/store'
import { FloorPlan } from './FloorPlan'
import { HintBar } from './HintBar'
import { LoadingScreen } from './LoadingScreen'
import { PropertyCard } from './PropertyCard'
import { RoomPanel } from './RoomPanel'
import { SceneLabels } from './SceneLabels'
import { TopBar } from './TopBar'

const TourCanvas = lazy(() => import('../scene/TourCanvas').then((m) => ({ default: m.TourCanvas })))

function SceneFallback() {
  return (
    <div className="scene-fallback" role="status">
      <p>Your browser can’t display 3D here, but you can still explore the floor plan and enquire.</p>
    </div>
  )
}

/** The interactive 3D tour: the scene, its labels, the panels and the floor plan. */
export function TourView() {
  const property = useProperty()
  const room = useActiveRoom()
  const [hasWebGL] = useState(isWebGLAvailable)
  const [isSceneReady, setSceneReady] = useState(false)
  const { active: isLoadingAssets, progress } = useProgress()
  const isTourReady = isSceneReady && !isLoadingAssets

  return (
    <>
      {hasWebGL ? (
        <Suspense fallback={null}>
          <TourCanvas onReady={() => setSceneReady(true)} />
          <SceneLabels property={property} />
        </Suspense>
      ) : (
        <SceneFallback />
      )}
      <TopBar />
      <main className="overlay">
        {room ? <RoomPanel property={property} room={room} /> : <PropertyCard property={property} />}
        <FloorPlan property={property} />
      </main>
      {hasWebGL && <HintBar />}
      {hasWebGL && <LoadingScreen propertyName={property.name} isDone={isTourReady} progress={progress} />}
    </>
  )
}
