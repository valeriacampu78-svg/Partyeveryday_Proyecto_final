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

        <svg
          className="home-hero__balloons"
          viewBox="0 0 340 420"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="balloon-pink" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FFE1E9" />
              <stop offset="1" stopColor="#E887A8" />
            </linearGradient>
            <linearGradient id="balloon-blue" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#E0F5F7" />
              <stop offset="1" stopColor="#8DC8D7" />
            </linearGradient>
            <linearGradient id="balloon-yellow" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FFF4CC" />
              <stop offset="1" stopColor="#F4CC73" />
            </linearGradient>
            <linearGradient id="balloon-lilac" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#F0E7FF" />
              <stop offset="1" stopColor="#B6A0D8" />
            </linearGradient>
          </defs>

          <g className="hero-balloon hero-balloon--pink">
            <path d="M74 22C49 22 32 42 32 69c0 25 24 51 39 68 2 3 6 3 8 0 15-17 39-43 39-68 0-27-17-47-44-47Z" fill="url(#balloon-pink)" stroke="white" strokeOpacity=".65" strokeWidth="2" />
            <ellipse cx="57" cy="51" fill="white" fillOpacity=".42" rx="8" ry="17" transform="rotate(25 57 51)" />
            <path d="m70 137 6 10 7-10m-7 10c-4 40 24 46 12 82-6 17-22 26-15 47 5 15 19 24 13 47" stroke="white" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g className="hero-balloon hero-balloon--blue">
            <path d="M178 4c-25 0-42 20-42 47 0 25 24 51 39 68 2 3 6 3 8 0 15-17 39-43 39-68 0-27-17-47-44-47Z" fill="url(#balloon-blue)" stroke="white" strokeOpacity=".7" strokeWidth="2" />
            <ellipse cx="161" cy="32" fill="white" fillOpacity=".5" rx="8" ry="16" transform="rotate(25 161 32)" />
            <path d="m174 119 6 10 7-10m-7 10c9 36-22 51-6 79 9 16 24 22 22 43-1 13-9 22-4 38" stroke="white" strokeOpacity=".82" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g className="hero-balloon hero-balloon--yellow">
            <path d="M264 63c-24 0-41 19-41 45 0 24 23 49 38 66 2 3 6 3 8 0 15-17 38-42 38-66 0-26-17-45-43-45Z" fill="url(#balloon-yellow)" stroke="white" strokeOpacity=".72" strokeWidth="2" />
            <ellipse cx="247" cy="91" fill="white" fillOpacity=".55" rx="7" ry="15" transform="rotate(25 247 91)" />
            <path d="m259 174 6 10 7-10m-7 10c-9 37 23 50 8 79-8 15-24 22-21 42 2 13 11 22 7 37" stroke="white" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" />
          </g>

          <g className="hero-balloon hero-balloon--lilac">
            <path d="M111 128c-22 0-37 17-37 41 0 22 20 44 34 60 2 3 5 3 7 0 14-16 34-38 34-60 0-24-15-41-38-41Z" fill="url(#balloon-lilac)" stroke="white" strokeOpacity=".72" strokeWidth="2" />
            <ellipse cx="96" cy="154" fill="white" fillOpacity=".5" rx="7" ry="14" transform="rotate(25 96 154)" />
            <path d="m108 228 6 9 6-9m-6 9c-9 31 16 45 5 69-7 14-19 20-16 38" stroke="white" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
          </g>

          <path d="m302 21 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Zm-259 129 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" fill="#FFF2C9" fillOpacity=".95" />
        </svg>

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
        <div className="services-confetti" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
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

      <section className="quote-section" id="cotizacion">
        <div className="quote-section__inner">
          <div className="quote-section__heading">
            <span className="quote-section__eyebrow">FÁCIL, CERCANO Y A TU MEDIDA</span>
            <h2 className="font-titulo">Tu celebración empieza<br />con una idea</h2>
            <p>Te acompañamos desde el primer mensaje hasta el momento de celebrar.</p>
          </div>

          <div className="quote-panel">
            <div className="quote-process">
              <div className="quote-process__heading">
                <span className="quote-process__sparkle" aria-hidden="true">✦</span>
                <div>
                  <span className="quote-process__eyebrow">ASÍ DE SENCILLO</span>
                  <h3>¿Cómo trabajamos?</h3>
                </div>
              </div>

              <ol className="quote-steps">
                <li className="quote-step">
                  <span className="quote-step__number">01</span>
                  <div>
                    <h4>Cuéntanos tu idea</h4>
                    <p>Compártenos el tipo de evento, la fecha y eso que imaginas.</p>
                  </div>
                </li>
                <li className="quote-step">
                  <span className="quote-step__number">02</span>
                  <div>
                    <h4>Diseñamos tu propuesta</h4>
                    <p>Elegimos juntas los detalles y preparamos una cotización a tu medida.</p>
                  </div>
                </li>
                <li className="quote-step">
                  <span className="quote-step__number">03</span>
                  <div>
                    <h4>¡Hacemos magia!</h4>
                    <p>Preparamos cada rincón para que tú solo te ocupes de disfrutar.</p>
                  </div>
                </li>
              </ol>
            </div>

            <aside className="quote-contact">
              <span className="quote-contact__decorations" aria-hidden="true">
                <span className="quote-contact__decoration-item quote-contact__decoration-item--star">✦</span>
                <span className="quote-contact__decoration-item quote-contact__decoration-item--twinkle">✧</span>
                <span className="quote-contact__decoration-item quote-contact__decoration-item--sparkle quote-contact__decoration-item--sparkle-one">✧</span>
                <span className="quote-contact__decoration-item quote-contact__decoration-item--sparkle quote-contact__decoration-item--sparkle-two">✦</span>
                <span className="quote-contact__decoration-item quote-contact__decoration-item--sparkle quote-contact__decoration-item--sparkle-three">✧</span>
                <span className="quote-contact__decoration-item quote-contact__decoration-item--confetti" />
                <span className="quote-contact__decoration-item quote-contact__decoration-item--dot" />
                <span className="quote-contact__decoration-item quote-contact__decoration-item--small-star">✳</span>
              </span>
              <span className="quote-contact__icon" aria-hidden="true">✳</span>
              <span className="quote-contact__eyebrow">EL PRIMER PASO</span>
              <h3>¿Lista para celebrar?</h3>
              <p>Hablemos de tu evento. Escríbenos por WhatsApp y empecemos a crear algo especial.</p>
              <a
                className="quote-contact__button"
                href="https://wa.me/593968668970"
                target="_blank"
                rel="noopener noreferrer"
              >
                Cotizar por WhatsApp <span aria-hidden="true">↗</span>
              </a>
              <span className="quote-contact__note">Respondemos con mucho gusto</span>
            </aside>
          </div>
        </div>
      </section>

    </div>
  );
}

export default App;