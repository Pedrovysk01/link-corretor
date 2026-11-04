import { useTour } from './state/store'
import { FilmIntro } from './ui/film/FilmIntro'
import { InquiryDialog } from './ui/InquiryDialog'
import { TourView } from './ui/TourView'

/** The cinematic film first, then the interactive tour; the inquiry form is reachable from both. */
export default function App() {
  const view = useTour((s) => s.view)
  return (
    <div className="app">
      {view === 'film' ? <FilmIntro /> : <TourView />}
      <InquiryDialog />
    </div>
  )
}
