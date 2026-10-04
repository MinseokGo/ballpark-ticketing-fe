import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AdminHomePage } from './pages/AdminHomePage'
import { BookingGamesPage } from './pages/BookingGamesPage'
import { BookingSeatMapPage } from './pages/BookingSeatMapPage'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { SeatsPage } from './pages/SeatsPage'
import { SectionsPage } from './pages/SectionsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="booking" element={<BookingGamesPage />} />
        <Route path="booking/:gameId" element={<BookingSeatMapPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminHomePage />} />
        <Route path="admin/sections" element={<SectionsPage />} />
        <Route path="admin/seats" element={<SeatsPage />} />
        <Route path="admin/games" element={<GamesPage />} />
      </Route>
    </Routes>
  )
}

export default App
