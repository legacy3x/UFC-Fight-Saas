import { FC } from 'react'
import { Link } from 'react-router-dom'

const Navbar: FC = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/predictions">Predictions</Link></li>
        <li><Link to="/admin">Admin</Link></li>
      </ul>
    </nav>
  )
}

export default Navbar
