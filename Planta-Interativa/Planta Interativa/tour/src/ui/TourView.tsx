import { useProgress } from '@react-three/drei'
import { lazy, Suspense, useLayoutEffect, useState } from 'react'
import { querIntro } from '../lib/intro'
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
      <p>Seu navegador não consegue exibir o 3D aqui, mas você ainda pode explorar a planta e falar com o corretor.</p>
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
  // A abertura mapa→planta esconde painéis e rótulos desde o primeiro quadro; a CameraRig libera quando a câmera chega.
  useLayoutEffect(() => {
    if (querIntro(property, room !== null)) document.body.classList.add('intro-on')
  }, [property, room])
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
