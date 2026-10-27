import React from 'react';
import logo from '../assets/logo.png';

function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.8rem 2rem',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img 
          src={logo} 
          alt="Party Everyday Logo" 
          style={{ height: '45px', width: 'auto', borderRadius: '50%' }} 
        />
      </div>
      <div style={{ display: 'flex', gap: '20px', cursor: 'pointer', fontWeight: '500', color: '#555' }}>
        <span>Inicio</span>
        <span>Servicios</span>
        <span>Galería</span>
        <span>Contacto</span>
      </div>
    </nav>
  );
}

export default Navbar;