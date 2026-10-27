import React, { useState, useEffect } from 'react';
import Navbar from './Componentes/Navbar';

// Verifica que el nombre y la extensión (.jpg, .png o .jpeg) sean iguales a tus archivos en assets
import foto1 from './assets/Foto1.jpeg';
import foto2 from './assets/Foto2.jpeg';
import foto3 from './assets/Foto3.jpeg';

function App() {
  const imagenesFondo = [foto1, foto2, foto3];
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prevIndice) => (prevIndice + 1) % imagenesFondo.length);
    }, 4000);

    return () => clearInterval(intervalo);
  }, [imagenesFondo.length]);

  return (
    <div>
      <Navbar />
      
      <main style={{
        position: 'relative',
        height: '460px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        borderBottom: '3px solid #fbd3d9'
      }}>
        
        {imagenesFondo.map((imagen, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${imagen})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: index === indiceActual ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 1
            }}
          />
        ))}

        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 245, 247, 0.65)',
          backdropFilter: 'blur(1px)',
          zIndex: 2
        }} />

        <div style={{
          position: 'relative',
          zIndex: 3,
          padding: '20px',
          maxWidth: '700px'
        }}>
          <span style={{
            backgroundColor: '#ffffff',
            color: '#d87a96',
            padding: '7px 18px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
             Diseño de Eventos & Decoración 
          </span>

          <h1 style={{
            fontSize: '3rem',
            color: '#5a3d43',
            marginTop: '22px',
            marginBottom: '15px',
            fontWeight: '800',
            fontFamily: 'CosmicFont, "Segoe Print", cursive',
            textShadow: '0 2px 10px rgba(255, 255, 255, 0.9)'
          }}>
            ¡Bienvenido a Party Everyday! 🎉
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#5a3d43',
            fontWeight: '500',
            margin: '0 auto 30px auto',
            lineHeight: '1.6',
            fontFamily: 'CosmicFont, "Segoe Print", cursive',
            textShadow: '0 1px 6px rgba(255, 255, 255, 0.9)'
          }}>
            Tu plataforma ideal para la organización y decoración de eventos inolvidables. Creamos momentos mágicos a tu medida.
          </p>

          <button style={{
            backgroundColor: '#e28ca9',
            color: '#ffffff',
            border: 'none',
            padding: '13px 32px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            borderRadius: '25px',
            cursor: 'pointer',
            letterSpacing: '1.2px',
            boxShadow: '0 4px 15px rgba(226, 140, 169, 0.45)'
          }}>
            VER CATÁLOGO DE SERVICIOS
          </button>
        </div>

      </main>
    </div>
  );
}

export default App;