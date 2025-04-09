import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Predictions from './pages/Predictions'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}
