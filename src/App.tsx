import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BookingGamesPage } from './pages/BookingGamesPage'
import { BookingSeatMapPage } from './pages/BookingSeatMapPage'
import { HomePage } from './pages/HomePage'
import { LiveGamePage } from './pages/LiveGamePage'
import { RecordsPage } from './pages/RecordsPage'
import { ProfilePage } from './pages/ProfilePage'
import { TeamSchedulePage } from './pages/TeamSchedulePage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="booking" element={<BookingGamesPage />} />
        <Route path="booking/:gameId" element={<BookingSeatMapPage />} />
        <Route path="games/:gameId/live" element={<LiveGamePage />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="schedule" element={<TeamSchedulePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

export default App
