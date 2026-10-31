import { useState, useEffect } from 'react';
import Navbar from './Componentes/Navbar';
import './App.css';
import foto1 from './assets/Foto1.jpeg';
import foto2 from './assets/Foto2.jpeg';
import foto3 from './assets/Foto3.jpeg';
import serv1_a from './assets/serv1_a.jpeg';
import serv1_b from './assets/serv1_b.jpeg';
import serv2_a from './assets/serv2_a.jpeg';
import serv2_b from './assets/serv2_b.jpeg';
import serv3_a from './assets/serv3_a.jpeg';
import serv3_b from './assets/serv3_b.jpeg';

function TarjetaServicio({ numero, titulo, descripcion, imagenes, colorBarra }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndice((prev) => (prev + 1) % imagenes.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [imagenes.length]);

  return (
    <article className="service-card" style={{ '--service-accent': colorBarra }}>
      <a className="service-card__link" href="#cotizacion" aria-label={`Cotiza ${titulo}`}>
        <div className="service-card__image">
        {imagenes.map((img, i) => (
          <img
            key={i}
            className={i === indice ? 'is-active' : ''}
            src={img}
            alt={`${titulo.toLowerCase()} - propuesta ${i + 1}`}
            aria-hidden={i !== indice}
            style={{
              opacity: i === indice ? 1 : 0,
            }}
          />
        ))}
          <span className="service-card__eyebrow">PARTY EVERYDAY</span>
          <span className="service-card__number">{numero} / 03</span>
          <span className="service-card__image-title">{titulo}</span>
          <span className="service-card__arrow" aria-hidden="true">↗</span>
          <div className="service-card__pagination" aria-label={`Imagen ${indice + 1} de ${imagenes.length}`}>
            {imagenes.map((_, i) => (
              <span
                key={i}
                className={i === indice ? 'is-active' : ''}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <div className="service-card__details">
          <p>{descripcion}</p>
          <span className="service-card__cta">Descubre este servicio <span aria-hidden="true">→</span></span>
        </div>
      </a>
    </article>
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
      numero: '01',
      titulo: 'DECORACIÓN CON GLOBOS',
      descripcion: 'Arcos, fondos y rincones llenos de color para celebrar a lo grande.',
      imagenes: [serv1_a, serv1_b],
      colorBarra: '#fbd3d9'
    },
    {
      numero: '02',
      titulo: 'MESAS DE DULCES & PASTELERÍA',
      descripcion: 'Un rincón delicioso con detalles pensados para sorprender a todos.',
      imagenes: [serv2_a, serv2_b],
      colorBarra: '#e28ca9'
    },
    {
      numero: '03',
      titulo: 'DISEÑO DE MESAS & FLORALES',
      descripcion: 'Mesas especiales, flores y pequeños detalles que crean el ambiente.',
      imagenes: [serv3_a, serv3_b],
      colorBarra: '#f4b6c2'
    }
  ];

  return (
    <div>
      <Navbar />

      <main className="home-hero" id="inicio">
        {imagenesFondo.map((imagen, index) => (
          <img
            key={index}
            className={`home-hero__image${index === indiceActual ? ' is-active' : ''}`}
            src={imagen}
            alt=""
            aria-hidden="true"
          />
        ))}

        <div className="home-hero__content">
          <span className="home-hero__eyebrow"><span aria-hidden="true">✦</span> Diseño de eventos & decoración</span>
          <h1 className="home-hero__title">Celebremos<br /><em>lo extraordinario.</em></h1>
          <p className="home-hero__description">
            Diseñamos momentos mágicos, llenos de detalles y hechos especialmente para ti.
          </p>
          <div className="home-hero__actions">
            <a className="home-hero__button home-hero__button--primary" href="#servicios">
              Explorar servicios <span aria-hidden="true">↗</span>
            </a>
            <a className="home-hero__button home-hero__button--secondary" href="#cotizacion">
              Hablemos de tu evento
            </a>
          </div>
          <div className="home-hero__footer">
            <div className="home-hero__pagination" aria-label="Seleccionar imagen de portada">
              {imagenesFondo.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === indiceActual ? 'is-active' : ''}
                  onClick={() => setIndiceActual(index)}
                  aria-label={`Mostrar imagen ${index + 1} de ${imagenesFondo.length}`}
                  aria-pressed={index === indiceActual}
                />
              ))}
            </div>
            <span className="home-hero__counter">{String(indiceActual + 1).padStart(2, '0')} <span>/</span> {String(imagenesFondo.length).padStart(2, '0')}</span>
            <a className="home-hero__scroll" href="#servicios">
              Descubre Party Everyday <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </main>

      <section className="services-section" id="servicios">
        <div className="services-section__inner">
          <div className="services-section__heading">
            <span className="services-section__eyebrow">LO HACEMOS ESPECIAL</span>
            <h2 className="font-titulo">Momentos únicos,<br />detalles inolvidables</h2>
            <p>Creamos cada rincón para que tu celebración se sienta muy tuya.</p>
          </div>

          <div className="services-grid">
            {servicios.map((serv) => (
            <TarjetaServicio
              key={serv.numero}
              numero={serv.numero}
              titulo={serv.titulo}
              descripcion={serv.descripcion}
              imagenes={serv.imagenes}
              colorBarra={serv.colorBarra}
            />
          ))}
          </div>
          <p className="services-section__note"><span aria-hidden="true">✦</span> Cada detalle se adapta a tu celebración.</p>
        </div>
      </section>

      {/* Sección de Cotización y Proceso */}
      <section id="cotizacion" style={{
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