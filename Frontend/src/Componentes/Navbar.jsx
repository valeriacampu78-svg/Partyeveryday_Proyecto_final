import React from 'react';
import logo from '../assets/logo.png';

function Navbar() {
  return (
    <header style={{ width: '100%', fontFamily: 'sans-serif' }}>
      
      {/* 1. Parte superior blanca con el logo centrado y con zoom */}
      <div style={{
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '85px',
        overflow: 'hidden'
      }}>
        <img 
          src={logo} 
          alt="Party Everyday Logo" 
          style={{ 
            height: '80px', 
            width: 'auto', 
            objectFit: 'contain',
            transform: 'scale(1.6)' // <-- Aquí le hacemos zoom al logo
          }} 
        />
      </div>

      {/* 2. Barra de menú con tu color rosado pastel */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '35px',
        padding: '10px 20px',
        backgroundColor: '#fbd3d9',
      }}>
        <span style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#5a3d43', letterSpacing: '1.5px' }}>INICIO</span>
        <span style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#5a3d43', letterSpacing: '1.5px' }}>SERVICIOS</span>
        <span style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#5a3d43', letterSpacing: '1.5px' }}>GALERÍA</span>
        
        {/* Botón resaltado como en tu referencia */}
        <span style={{ 
          cursor: 'pointer', 
          fontSize: '0.75rem', 
          fontWeight: 'bold', 
          color: '#ffffff', 
          backgroundColor: '#e28ca9', 
          padding: '6px 16px', 
          borderRadius: '15px',
          letterSpacing: '1px'
        }}>
          CONTACTO
        </span>
      </nav>

    </header>
  );
}

export default Navbar;