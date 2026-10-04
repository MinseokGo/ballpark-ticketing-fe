import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BookingGamesPage } from './pages/BookingGamesPage'
import { BookingSeatMapPage } from './pages/BookingSeatMapPage'
import { DashboardPage } from './pages/DashboardPage'
import { GamesPage } from './pages/GamesPage'
import { SeatsPage } from './pages/SeatsPage'
import { SectionsPage } from './pages/SectionsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="booking" element={<BookingGamesPage />} />
        <Route path="booking/:gameId" element={<BookingSeatMapPage />} />
        <Route path="sections" element={<SectionsPage />} />
        <Route path="seats" element={<SeatsPage />} />
        <Route path="games" element={<GamesPage />} />
      </Route>
    </Routes>
  )
}

export default App
