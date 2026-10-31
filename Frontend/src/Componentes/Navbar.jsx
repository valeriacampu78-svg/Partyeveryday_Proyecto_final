import logo from '../assets/logo.png';
import './Navbar.css';

function Navbar() {
  return (
    <header className="site-header">
      <a className="site-brand" href="#inicio" aria-label="Party Everyday, ir al inicio">
        <span className="site-brand__line site-brand__line--left" aria-hidden="true" />
        <img src={logo} alt="Party Everyday Event Planning" />
        <span className="site-brand__line site-brand__line--right" aria-hidden="true" />
      </a>

      <nav className="menu-bar" aria-label="Navegación principal">
        <a className="menu-bar__link" href="#inicio">
          INICIO
        </a>

        <a className="menu-bar__link" href="#servicios">
          SERVICIOS
        </a>

        <a className="menu-bar__link" href="#cotizacion">
          COTIZACIÓN
        </a>

        <a className="menu-bar__link menu-bar__link--contact" href="#contacto">
          CONTACTO
        </a>
      </nav>
    </header>
  );
}

export default Navbar;
