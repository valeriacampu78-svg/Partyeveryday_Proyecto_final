import React, { useState, useEffect } from 'react';
import Navbar from './Componentes/Navbar';
import foto1 from './assets/Foto1.jpeg';
import foto2 from './assets/Foto2.jpeg';
import foto3 from './assets/Foto3.jpeg';
import serv1_a from './assets/serv1_a.jpeg';
import serv1_b from './assets/serv1_b.jpeg';
import serv2_a from './assets/serv2_a.jpeg';
import serv2_b from './assets/serv2_b.jpeg';
import serv3_a from './assets/serv3_a.jpeg';
import serv3_b from './assets/serv3_b.jpeg';

// Componente de tarjeta con transición distinta (Zoom + Desvanecimiento dinámico)
function TarjetaServicio({ titulo, imagenes, colorBarra }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndice((prev) => (prev + 1) % imagenes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [imagenes.length]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      overflow: 'hidden',
      width: '320px',
      boxShadow: '0 8px 25px rgba(226, 140, 169, 0.15)',
      border: '1px solid #f8e1e7'
    }}>
      {/* Contenedor con efecto de zoom y transición única */}
      <div style={{ height: '220px', position: 'relative', overflow: 'hidden' }}>
        {imagenes.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={titulo}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: i === indice ? 1 : 0,
              transform: i === indice ? 'scale(1)' : 'scale(1.1)',
              transition: 'opacity 1.2s ease-in-out, transform 1.5s ease-in-out',
            }}
          />
        ))}
      </div>

      {/* Barra inferior con el título */}
      <div style={{
        backgroundColor: colorBarra,
        padding: '18px 15px',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '0.9rem',
          fontWeight: '700',
          color: '#5a3d43',
          letterSpacing: '1px',
          margin: 0
        }}>
          {titulo}
        </h3>
      </div>
    </div>
  );
}

function App() {
  const imagenesFondo = [foto1, foto2, foto3];
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prevIndice) => (prevIndice + 1) % imagenesFondo.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [imagenesFondo.length]);

  const servicios = [
    {
      titulo: 'DECORACIÓN CON GLOBOS',
      imagenes: [serv1_a, serv1_b],
      colorBarra: '#fbd3d9'
    },
    {
      titulo: 'MESAS DE DULCES & PASTELERÍA',
      imagenes: [serv2_a, serv2_b],
      colorBarra: '#e28ca9'
    },
    {
      titulo: 'DISEÑO DE MESAS & FLORALES',
      imagenes: [serv3_a, serv3_b],
      colorBarra: '#f4b6c2'
    }
  ];

  return (
    <div>
      <Navbar />

      {/* Portada Principal con Carrusel (Sin botón) */}
      <main style={{
        position: 'relative',
        height: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
        borderBottom: '3px solid #fbd3d9',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 240, 244, 0.18))'
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
          padding: '32px 24px',
          maxWidth: '780px'
        }}>
          <span style={{
            fontFamily: "'Segoe UI', sans-serif",
            backgroundColor: '#ffffff',
            color: '#d87a96',
            padding: '8px 20px',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: '0 6px 18px rgba(214, 126, 156, 0.12)'
          }}>
            Diseño de Eventos & Decoración
          </span>

          <h1 style={{
            fontFamily: "'CosmicFont', serif",
            fontSize: '3.8rem',
            color: '#5a3d43',
            marginTop: '22px',
            marginBottom: '12px',
            fontWeight: 'normal',
            lineHeight: '1.1',
            letterSpacing: '0.5px',
            textShadow: '0 2px 10px rgba(255, 255, 255, 0.9)'
          }}>
            ¡Bienvenido a Party Everyday!
          </h1>

          <p style={{
            fontFamily: "'Segoe UI', Tahoma, sans-serif",
            fontSize: '1.08rem',
            color: '#6d4c53',
            fontWeight: '600',
            letterSpacing: '0.4px',
            margin: '0 auto',
            lineHeight: '1.7',
            maxWidth: '560px',
            textShadow: '0 1px 8px rgba(255, 255, 255, 0.9)'
          }}>
            Creamos escenarios mágicos y celebraciones únicas diseñadas especialmente a tu medida.
          </p>
        </div>
      </main>

      {/* Sección de Servicios */}
      <section style={{ padding: '60px 20px', backgroundColor: 'transparent', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', marginBottom: '40px' }}>
          <span className="font-titulo" style={{
            backgroundColor: '#fbd3d9',
            color: '#5a3d43',
            padding: '8px 24px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(251, 211, 217, 0.5)'
          }}>
            Servicios
          </span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '30px',
          flexWrap: 'wrap',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {servicios.map((serv, index) => (
            <TarjetaServicio
              key={index}
              titulo={serv.titulo}
              imagenes={serv.imagenes}
              colorBarra={serv.colorBarra}
            />
          ))}
        </div>
      </section>

      {/* Sección de Cotización y Proceso (Bloque unificado sin fondos repetidos de servicios) */}
      <section style={{ 
        padding: '60px 20px', 
        backgroundColor: 'transparent', 
        textAlign: 'center' 
      }}>
        <div style={{ display: 'inline-block', marginBottom: '40px' }}>
          <span className="font-titulo" style={{
            backgroundColor: '#fbd3d9',
            color: '#5a3d43',
            padding: '8px 24px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(251, 211, 217, 0.5)'
          }}>
            Cotización & Proceso
          </span>
        </div>

        {/* Tarjeta contenedora principal blanca y limpia */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '30px',
          padding: '50px 40px',
          maxWidth: '1050px',
          margin: '0 auto',
          boxShadow: '0 12px 35px rgba(226, 140, 169, 0.18)',
          border: '1px solid #f8e1e7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '40px',
          flexWrap: 'wrap',
          textAlign: 'left'
        }}>
          
          {/* Lado Izquierdo: El Paso a Paso (Sin fondo de tarjeta interna, limpio) */}
          <div style={{ flex: '1 1 500px' }}>
            <h3 style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#5a3d43',
              marginBottom: '25px',
              letterSpacing: '1px'
            }}>
              ¿Cómo trabajamos?
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{
                  backgroundColor: '#fbd3d9',
                  color: '#5a3d43',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>1</span>
                <div>
                  <strong style={{ color: '#5a3d43', fontSize: '0.95rem', display: 'block', marginBottom: '3px' }}>Cuéntanos tu idea</strong>
                  <p style={{ color: '#6d4c53', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Escríbenos contándonos el tipo de evento, la fecha aproximada y qué tienes en mente.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{
                  backgroundColor: '#e28ca9',
                  color: '#ffffff',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>2</span>
                <div>
                  <strong style={{ color: '#5a3d43', fontSize: '0.95rem', display: 'block', marginBottom: '3px' }}>Diseñamos tu propuesta</strong>
                  <p style={{ color: '#6d4c53', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Te asesoramos con los paquetes, globos, colores y armamos la cotización perfecta para ti.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <span style={{
                  backgroundColor: '#f4b6c2',
                  color: '#5a3d43',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  flexShrink: 0
                }}>3</span>
                <div>
                  <strong style={{ color: '#5a3d43', fontSize: '0.95rem', display: 'block', marginBottom: '3px' }}>¡Hacemos magia!</strong>
                  <p style={{ color: '#6d4c53', fontSize: '0.85rem', margin: 0, lineHeight: '1.5' }}>Nos encargamos de la instalación y decoración para que solo te preocupes por disfrutar.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lado Derecho: Llamado a WhatsApp (Limpio y directo) */}
          <div style={{ 
            flex: '1 1 320px', 
            textAlign: 'center',
            backgroundColor: '#fff7f9',
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid #f8e1e7'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#5a3d43',
              marginBottom: '12px',
              letterSpacing: '1px'
            }}>
              ¿Lista para cotizar?
            </h3>

            <p style={{
              color: '#6d4c53',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              marginBottom: '25px'
            }}>
              Conversa directamente con nosotras por WhatsApp para coordinar todos los detalles de tu evento de forma rápida y cercana.
            </p>

            <a
              href="https://wa.me/593968668970"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'Segoe UI', sans-serif",
                backgroundColor: '#e28ca9',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '14px 28px',
                fontSize: '0.82rem',
                fontWeight: '800',
                borderRadius: '999px',
                letterSpacing: '1.5px',
                boxShadow: '0 6px 18px rgba(226, 140, 169, 0.3)',
                display: 'inline-block',
                transition: 'transform 0.2s ease'
              }}
            >
              ESCRIBIR POR WHATSAPP
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}

export default App;