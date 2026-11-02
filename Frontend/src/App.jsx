import { useState, useEffect, useRef } from 'react';
import Navbar from './Componentes/Navbar';
import './App.css';
import logo from './assets/logo.png';
import foto1 from './assets/Foto1.jpeg';
import foto2 from './assets/Foto2.jpeg';
import foto3 from './assets/Foto3.jpeg';
import serv1_a from './assets/serv1_a.jpeg';
import serv1_b from './assets/serv1_b.jpeg';
import serv2_a from './assets/serv2_a.jpeg';
import serv2_b from './assets/serv2_b.jpeg';
import serv3_a from './assets/serv3_a.jpeg';
import serv3_b from './assets/serv3_b.jpeg';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const serviceImages = {
  balloons: serv1_a,
  sweets: serv2_a,
  florals: serv3_a,
};

async function readApiResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    if (response.ok) throw new Error('El servidor devolvió una respuesta inválida.');
  }
  if (!response.ok) {
    const error = new Error(payload.error || 'No se pudo completar la solicitud.');
    error.code = payload.code;
    throw error;
  }
  return payload;
}

function TarjetaServicio({ titulo, descripcion, imagenes, colorBarra }) {
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

function ClientServiceCard({ service, selected, recommended, onSelect }) {
  return (
    <article className={`dashboard-service-card${recommended ? ' is-recommended' : ''}${selected ? ' is-selected' : ''}`}>
      <img
        className="dashboard-service-card__image"
        src={serviceImages[service.imageKey] || foto1}
        alt={service.name}
      />
      <div className="dashboard-service-card__content">
        {recommended && <span className="dashboard-service-card__badge">RECOMENDADO PARA TI</span>}
        <h3>{service.name}</h3>
        <p>{service.description}</p>
        <button type="button" onClick={() => onSelect(service)}>
          {selected ? 'Servicio elegido' : 'Elegir este servicio'}
        </button>
      </div>
    </article>
  );
}

function dateToInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function appointmentDateObject(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function formatAppointmentDate(date) {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'long'
  }).format(appointmentDateObject(date));
}

function imageFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const separatorIndex = dataUrl.indexOf(',');
      if (separatorIndex < 0) {
        reject(new Error('No se pudo leer una de las imágenes.'));
        return;
      }
      resolve({
        fileName: file.name,
        mimeType: file.type,
        data: dataUrl.slice(separatorIndex + 1),
      });
    });
    reader.addEventListener('error', () => reject(new Error('No se pudo leer una de las imágenes.')));
    reader.readAsDataURL(file);
  });
}

function PinterestSearchLinks({ links, className = '' }) {
  if (!Array.isArray(links) || links.length === 0) return null;
  return (
    <div className={`dashboard-inspiration__search-links ${className}`.trim()}>
      {links.map((link) => (
        <a
          className="dashboard-inspiration__search-link"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          key={link.query}
        >
          <strong>{link.title}</strong>
          <span>{link.query}</span>
          <small>Buscar en Pinterest ↗</small>
        </a>
      ))}
    </div>
  );
}

function CreativeProposalCard({ proposal, className = '' }) {
  const hasDetails = proposal.ideas?.length || proposal.trends?.length ||
    proposal.palette?.length || proposal.style;
  return (
    <article className={`creative-proposal-card ${className}`.trim()}>
      <header className="creative-proposal-card__heading">
        <span className="creative-proposal-card__icon" aria-hidden="true">✦</span>
        <div>
          <span className="client-dashboard__eyebrow">PROPUESTA PARA TU EVENTO</span>
          <h4>{proposal.title || 'Una idea pensada para ti'}</h4>
          <p>{proposal.answer}</p>
        </div>
      </header>
      {hasDetails ? (
        <div className="creative-proposal-card__grid">
          <div className="creative-proposal-card__sections">
            {proposal.ideas?.length > 0 && (
              <section className="creative-proposal-card__section">
                <h5><span aria-hidden="true">✧</span> Ideas</h5>
                <ul>
                  {proposal.ideas.map((idea, index) => <li key={`${index}-${idea}`}>{idea}</li>)}
                </ul>
              </section>
            )}
            {proposal.trends?.length > 0 && (
              <section className="creative-proposal-card__section">
                <h5><span aria-hidden="true">✳</span> Tendencias e inspiración</h5>
                <ul>
                  {proposal.trends.map((trend, index) => <li key={`${index}-${trend}`}>{trend}</li>)}
                </ul>
              </section>
            )}
          </div>
          <div className="creative-proposal-card__visual-style">
            {proposal.palette?.length > 0 && (
              <section className="creative-proposal-card__section">
                <h5>Paleta de colores sugerida</h5>
                <div className="creative-proposal-card__palette">
                  {proposal.palette.map((color) => (
                    <span
                      className="creative-proposal-card__swatch"
                      key={`${color.hex}-${color.name}`}
                      title={`${color.name} ${color.hex}`}
                      aria-label={`${color.name}, ${color.hex}`}
                    >
                      <i style={{ backgroundColor: color.hex }} />
                    </span>
                  ))}
                </div>
                <ul className="creative-proposal-card__color-names">
                  {proposal.palette.map((color) => (
                    <li key={`${color.hex}-${color.name}`}>{color.name}</li>
                  ))}
                </ul>
              </section>
            )}
            {proposal.style && (
              <section className="creative-proposal-card__section creative-proposal-card__style">
                <h5>Estilo</h5>
                <p>{proposal.style}</p>
              </section>
            )}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ClientDashboard({
  user,
  appointments,
  appointmentsError,
  onBookAppointment,
  onLogout
}) {
  const [selectedDate, setSelectedDate] = useState(dateToInputValue(new Date()));
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [ideaQuery, setIdeaQuery] = useState('');
  const [activeIdeaQuery, setActiveIdeaQuery] = useState('');
  const [inspiration, setInspiration] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedIdeaImages, setSelectedIdeaImages] = useState([]);
  const [ideaImageError, setIdeaImageError] = useState('');
  const [inspirationLoading, setInspirationLoading] = useState(false);
  const [inspirationError, setInspirationError] = useState('');
  const bookingRef = useRef(null);
  const ideaImageInputRef = useRef(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [bookingNotice, setBookingNotice] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [serviceCatalogLoading, setServiceCatalogLoading] = useState(true);
  const [serviceCatalogError, setServiceCatalogError] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [serviceRecommendation, setServiceRecommendation] = useState(null);
  const [serviceRecommendationLoading, setServiceRecommendationLoading] = useState(false);
  const [serviceRecommendationError, setServiceRecommendationError] = useState('');
  const [selectedServiceSlug, setSelectedServiceSlug] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/services`, { credentials: 'include' })
      .then(readApiResponse)
      .then(({ services: catalog }) => {
        if (!Array.isArray(catalog)) throw new Error('El catálogo devolvió una respuesta inválida.');
        if (active) setServiceCatalog(catalog);
      })
      .catch((error) => {
        if (active) setServiceCatalogError(error.message || 'No se pudo cargar el catálogo.');
      })
      .finally(() => {
        if (active) setServiceCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const todayValue = dateToInputValue(new Date());
  const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const leadingDays = (firstDayOfMonth.getDay() + 6) % 7;
  const calendarDays = [
    ...Array(leadingDays).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1)
  ];
  const monthLabel = new Intl.DateTimeFormat('es-EC', {
    month: 'long',
    year: 'numeric'
  }).format(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 15, 12));
  const selectedAppointments = appointments.filter((appointment) => appointment.date === selectedDate);
  const sortedAppointments = [...appointments].sort((a, b) => (
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  ));
  const currentMonthIsToday = calendarMonth.getFullYear() === new Date().getFullYear()
    && calendarMonth.getMonth() === new Date().getMonth();

  const changeMonth = (amount) => {
    setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  const handleDateChange = (event) => {
    const nextDate = event.target.value;
    setSelectedDate(nextDate);
    if (nextDate) {
      const [year, month] = nextDate.split('-').map(Number);
      setCalendarMonth(new Date(year, month - 1, 1));
    }
    setBookingNotice('');
    setBookingMessage('');
  };

  const handleIdeaImageChange = (event) => {
    const files = Array.from(event.currentTarget.files || []);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFileSize = 2 * 1024 * 1024;
    const maxTotalSize = 6 * 1024 * 1024;

    if (files.length > 4) {
      setSelectedIdeaImages([]);
      setIdeaImageError('Puedes adjuntar hasta 4 imágenes.');
      event.currentTarget.value = '';
      return;
    }
    if (files.some((file) => !validTypes.includes(file.type))) {
      setSelectedIdeaImages([]);
      setIdeaImageError('Usa imágenes JPG, PNG o WebP.');
      event.currentTarget.value = '';
      return;
    }
    if (files.some((file) => file.size > maxFileSize)) {
      setSelectedIdeaImages([]);
      setIdeaImageError('Cada imagen debe pesar máximo 2 MB.');
      event.currentTarget.value = '';
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > maxTotalSize) {
      setSelectedIdeaImages([]);
      setIdeaImageError('El tamaño total de las imágenes no puede superar 6 MB.');
      event.currentTarget.value = '';
      return;
    }

    setSelectedIdeaImages(files);
    setIdeaImageError('');
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setBookingSubmitting(true);
    setBookingNotice('');
    setBookingMessage('');
    try {
      const appointment = {
        date: formData.get('appointmentDate'),
        time: formData.get('appointmentTime'),
        topic: formData.get('appointmentTopic').trim(),
        ideaImages: await Promise.all(selectedIdeaImages.map(imageFileToBase64)),
        ...(selectedServiceSlug ? { serviceSlug: selectedServiceSlug } : {}),
        ...(selectedProposal ? {
          creativeProposal: selectedProposal,
          creativeProposalRef: selectedProposal.creativeProposalRef,
        } : {})
      };
      const savedAppointment = await onBookAppointment(appointment);
      setSelectedDate(appointment.date);
      setBookingMessage(savedAppointment.zoomEmailSent
        ? '¡Tu cita está confirmada! Enviamos el enlace de Zoom a tu correo.'
        : 'Tu cita está confirmada. El enlace está en “Citas agendadas”, pero no pudimos enviarlo por correo.');
      setSelectedProposal(null);
      setSelectedServiceSlug('');
      setSelectedIdeaImages([]);
      setIdeaImageError('');
      form.reset();
      setSelectedTime('10:00');
    } catch (error) {
      setBookingNotice(error.message || 'No se pudo guardar la cita. Inténtalo nuevamente.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleIdeaSearch = async (event) => {
    event.preventDefault();
    const query = ideaQuery.trim();
    if (!query) return;

    setInspirationLoading(true);
    setInspirationError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/creative-assistant`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await readApiResponse(response);
      setActiveIdeaQuery(query);
      setInspiration(result);
    } catch (error) {
      setInspirationError(error.message || 'No se pudieron generar ideas. Inténtalo nuevamente.');
    } finally {
      setInspirationLoading(false);
    }
  };

  const handleServiceRecommendation = async (event) => {
    event.preventDefault();
    const details = eventDetails.trim();
    if (!details) return;

    setServiceRecommendationLoading(true);
    setServiceRecommendationError('');
    setServiceRecommendation(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/service-recommendations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventDetails: details }),
      });
      const { recommendation } = await readApiResponse(response);
      if (!recommendation?.serviceSlug || !recommendation.reason) {
        throw new Error('El asistente devolvió una recomendación incompleta.');
      }
      setServiceRecommendation(recommendation);
    } catch (error) {
      setServiceRecommendationError(error.message || 'No se pudo recomendar un servicio.');
    } finally {
      setServiceRecommendationLoading(false);
    }
  };

  const handleSelectService = (service) => {
    setSelectedServiceSlug(service.slug);
    setBookingNotice('');
    setBookingMessage('');
  };

  const handleSelectProposal = () => {
    setSelectedProposal({
      creativeProposalRef: inspiration.creativeProposalRef,
      query: activeIdeaQuery,
      answer: inspiration.answer,
      title: inspiration.title,
      ideas: inspiration.ideas || [],
      trends: inspiration.trends || [],
      palette: inspiration.palette || [],
      style: inspiration.style || '',
      links: inspiration.links || [],
    });
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <main className="client-dashboard">
      <header className="client-dashboard__header">
        <a className="client-dashboard__brand" href="#inicio" aria-label="Party Everyday, ir al inicio">
          <img src={logo} alt="Party Everyday" />
        </a>
        <div className="client-dashboard__user">
          <span>Hola, {user.name}</span>
          <button type="button" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="client-dashboard__content">
        <div className="client-dashboard__welcome">
          <span className="client-dashboard__eyebrow">TU ESPACIO DE PLANIFICACIÓN</span>
          <h1 className="font-titulo">¡Qué lindo verte, {user.name}!</h1>
          <p>Organicemos cada detalle de tu celebración, paso a paso.</p>
        </div>

        <div className="client-dashboard__demo-note" role="note">
          <span aria-hidden="true">✦</span>
          Al agendar, tu reunión de Zoom se confirma y te enviamos el enlace por correo. También podrás abrirlo desde aquí.
        </div>

        <section className="dashboard-services dashboard-card" aria-labelledby="services-title">
          <div className="dashboard-card__heading">
            <div>
              <span className="client-dashboard__eyebrow">ENCUENTRA EL SERVICIO IDEAL</span>
              <h2 id="services-title">Nuestro catálogo</h2>
            </div>
          </div>
          <p className="dashboard-services__intro">
            Cuéntale a Gemini qué celebración planeas y te orientará hacia el servicio que mejor podría encajar.
            La recomendación se basa en los servicios disponibles; los detalles y precios se confirman con el equipo.
          </p>
          <form className="dashboard-services__form" onSubmit={handleServiceRecommendation}>
            <label htmlFor="service-event-details">¿Qué estás organizando?</label>
            <textarea
              id="service-event-details"
              value={eventDetails}
              onChange={(event) => setEventDetails(event.target.value)}
              placeholder="Ej.: cumpleaños familiar, unas 25 personas, en un jardín; busco algo colorido y tengo un presupuesto aproximado..."
              maxLength={600}
              rows={3}
              required
            />
            <button type="submit" disabled={serviceRecommendationLoading || !eventDetails.trim()}>
              {serviceRecommendationLoading ? 'Buscando una opción…' : 'Recomiéndame un servicio'}
            </button>
          </form>
          {serviceRecommendationError && (
            <p className="dashboard-services__message is-error" role="alert">{serviceRecommendationError}</p>
          )}
          {serviceRecommendation && (
            <p className="dashboard-services__recommendation" aria-live="polite">
              <strong>Recomendación de Gemini:</strong> {
                serviceCatalog.find((service) => service.slug === serviceRecommendation.serviceSlug)?.name
                  || 'Servicio del catálogo'
              }. {serviceRecommendation.reason}
            </p>
          )}
          {serviceCatalogLoading ? (
            <p className="dashboard-services__message">Cargando servicios…</p>
          ) : serviceCatalogError ? (
            <p className="dashboard-services__message is-error" role="alert">{serviceCatalogError}</p>
          ) : serviceCatalog.length === 0 ? (
            <p className="dashboard-services__message">Estamos preparando el catálogo de servicios. Vuelve pronto.</p>
          ) : (
            <div className="dashboard-services__grid">
              {serviceCatalog.map((service) => (
                <ClientServiceCard
                  key={service.slug}
                  service={service}
                  recommended={serviceRecommendation?.serviceSlug === service.slug}
                  selected={selectedServiceSlug === service.slug}
                  onSelect={handleSelectService}
                />
              ))}
            </div>
          )}
          <p className="dashboard-services__selection" aria-live="polite">
            {selectedServiceSlug
              ? `Servicio elegido para conversar en tu cita: ${serviceCatalog.find((service) => service.slug === selectedServiceSlug)?.name || 'servicio seleccionado'}.`
              : 'Puedes elegir un servicio para conversarlo en tu cita, o agendar sin seleccionar uno.'}
          </p>
        </section>

        <div className="client-dashboard__grid">
          <section className="dashboard-card dashboard-calendar" aria-labelledby="calendar-title">
            <div className="dashboard-card__heading">
              <div>
                <span className="client-dashboard__eyebrow">ORGANIZA TU TIEMPO</span>
                <h2 id="calendar-title">Tu calendario</h2>
              </div>
              <div className="dashboard-calendar__controls">
                <button
                  type="button"
                  aria-label="Mes anterior"
                  disabled={currentMonthIsToday}
                  onClick={() => changeMonth(-1)}
                >
                  ‹
                </button>
                <span>{monthLabel}</span>
                <button type="button" aria-label="Mes siguiente" onClick={() => changeMonth(1)}>
                  ›
                </button>
              </div>
            </div>

            <div className="dashboard-calendar__grid" role="grid" aria-label={`Calendario de ${monthLabel}`}>
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <span className="dashboard-calendar__weekday" role="columnheader" key={day}>{day}</span>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span className="dashboard-calendar__empty" aria-hidden="true" key={`empty-${index}`} />;
                }

                const dayValue = dateToInputValue(new Date(
                  calendarMonth.getFullYear(),
                  calendarMonth.getMonth(),
                  day
                ));
                const hasAppointment = appointments.some((appointment) => appointment.date === dayValue);

                return (
                  <button
                    className={`dashboard-calendar__day${selectedDate === dayValue ? ' is-selected' : ''}${hasAppointment ? ' has-appointment' : ''}`}
                    type="button"
                    role="gridcell"
                    key={dayValue}
                    disabled={dayValue < todayValue}
                    aria-label={`${day} ${monthLabel}${hasAppointment ? ', tiene cita' : ''}`}
                    aria-pressed={selectedDate === dayValue}
                    onClick={() => handleDateChange({ target: { value: dayValue } })}
                  >
                    {day}
                    {hasAppointment && <span className="dashboard-calendar__marker" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <p className="dashboard-calendar__timezone">Horario de Ecuador · UTC−5</p>

            <div className="dashboard-calendar__appointments">
              <h3>{formatAppointmentDate(selectedDate)}</h3>
              {selectedAppointments.length === 0 ? (
                <p>No tienes citas para este día.</p>
              ) : (
                selectedAppointments.map((appointment) => (
                  <article className="dashboard-appointment" key={appointment.id}>
                    <span className="dashboard-appointment__time">{appointment.time}</span>
                    <div>
                      <h4>Reunión de planificación por Zoom</h4>
                      <p>{appointment.topic}</p>
                      {appointment.serviceName && <span>Servicio: {appointment.serviceName}</span>}
                      {appointment.status === 'confirmed' && appointment.zoomJoinUrl ? (
                        <a href={appointment.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                          Entrar a la reunión de Zoom
                        </a>
                      ) : (
                        <span>
                          {appointment.status === 'confirmed'
                            ? 'La reunión está confirmada.'
                            : appointment.status === 'cancelled'
                              ? 'Esta solicitud fue cancelada.'
                              : 'Solicitud enviada; pendiente de confirmación.'}
                        </span>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-card dashboard-booking" aria-labelledby="booking-title" ref={bookingRef}>
            <span className="dashboard-booking__icon" aria-hidden="true">✳</span>
            <span className="client-dashboard__eyebrow">HABLEMOS DE TU EVENTO</span>
            <h2 id="booking-title">Agenda una cita</h2>
            <p>Cuéntanos qué te gustaría conversar y elige el día y hora que te convienen.</p>

            <form className="dashboard-booking__form" onSubmit={handleBookingSubmit}>
              <label>
                Fecha
                <input
                  type="date"
                  name="appointmentDate"
                  min={todayValue}
                  value={selectedDate}
                  onChange={handleDateChange}
                  required
                />
              </label>
              <div className="dashboard-booking__time-picker">
                <div className="dashboard-booking__time-heading">
                  <span>Elige tu horario</span>
                  <span className="dashboard-booking__timezone">Hora de Ecuador · UTC−5</span>
                </div>
                <input type="hidden" name="appointmentTime" value={selectedTime} />
                <div className="dashboard-booking__time-slots" role="group" aria-label="Horarios disponibles">
                  {Array.from({ length: 17 }, (_, index) => {
                    const minutes = 9 * 60 + index * 30;
                    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
                    return (
                      <button
                        className={`dashboard-booking__time-slot${selectedTime === time ? ' is-selected' : ''}`}
                        type="button"
                        key={time}
                        aria-pressed={selectedTime === time}
                        onClick={() => setSelectedTime(time)}
                      >
                        <span aria-hidden="true">{selectedTime === time ? '✦' : '◷'}</span>
                        {time}
                      </button>
                    );
                  })}
                </div>
                <p className="dashboard-booking__time-selection" aria-live="polite">
                  <span aria-hidden="true">✧</span> Tu cita será a las <strong>{selectedTime}</strong>
                </p>
              </div>
              <label>
                ¿De qué te gustaría hablar?
                <textarea
                  name="appointmentTopic"
                  placeholder="Ej.: decoración, presupuesto, fecha del evento..."
                  rows="4"
                  maxLength="500"
                  required
                />
              </label>
              <div className="dashboard-booking__image-upload">
                <label htmlFor="appointment-idea-images">
                  Imágenes de referencia <span>(opcional)</span>
                </label>
                <p>Comparte fotos que nos ayuden a imaginar tu evento.</p>
                <input
                  ref={ideaImageInputRef}
                  id="appointment-idea-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleIdeaImageChange}
                  aria-describedby="idea-image-help idea-image-error"
                />
                <p id="idea-image-help" className="dashboard-booking__image-help">
                  Hasta 4 imágenes, máximo 6 MB en total.
                </p>
                <div className="dashboard-booking__image-picker">
                  <span className="dashboard-booking__image-picker-icon" aria-hidden="true">↥</span>
                  <div>
                    <strong>
                      {selectedIdeaImages.length
                        ? `${selectedIdeaImages.length} de 4 imágenes seleccionadas`
                        : 'Agrega tus imágenes de inspiración'}
                    </strong>
                    <span>JPG, PNG o WebP · Máximo 2 MB cada una</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => ideaImageInputRef.current?.click()}
                    aria-label="Seleccionar imágenes de referencia"
                  >
                    {selectedIdeaImages.length ? 'Cambiar' : 'Elegir imágenes'}
                  </button>
                </div>
              </div>
              {selectedIdeaImages.length > 0 && (
                <ul className="dashboard-booking__image-list" aria-label="Imágenes adjuntas">
                  {selectedIdeaImages.map((file, index) => (
                    <li key={`${file.name}-${file.lastModified}-${index}`}>
                      <span>{file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <button
                        type="button"
                        aria-label={`Quitar ${file.name}`}
                        onClick={() => setSelectedIdeaImages((images) => (
                          images.filter((image) => image !== file)
                        ))}
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {ideaImageError && (
                <p className="dashboard-booking__message is-error" id="idea-image-error" role="alert">
                  {ideaImageError}
                </p>
              )}
              {bookingNotice && <p className="dashboard-booking__message is-error" role="alert">{bookingNotice}</p>}
              {bookingMessage && <p className="dashboard-booking__message" role="status">{bookingMessage}</p>}
              {selectedProposal && (
                <div className="dashboard-booking__proposal" role="status">
                  <div>
                    <strong>Idea incluida para conversar</strong>
                    <span>{selectedProposal.query}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedProposal(null)}>
                    Quitar
                  </button>
                </div>
              )}
              {appointmentsError && <p className="dashboard-booking__message is-error" role="alert">{appointmentsError}</p>}
              <button className="dashboard-booking__submit" type="submit" disabled={bookingSubmitting}>
                {bookingSubmitting ? 'Agendando cita…' : 'Agendar cita'} <span aria-hidden="true">↗</span>
              </button>
            </form>
            <p className="dashboard-booking__note">
              La idea seleccionada y las imágenes adjuntas se compartirán con administración para preparar tu cita.
            </p>
          </section>
        </div>

        <section className="dashboard-upcoming" aria-labelledby="upcoming-title">
          <div className="dashboard-card__heading">
            <div>
              <span className="client-dashboard__eyebrow">TUS REUNIONES</span>
              <h2 id="upcoming-title">Citas agendadas</h2>
            </div>
            <span className="dashboard-upcoming__count">{appointments.length}</span>
          </div>
          {sortedAppointments.length === 0 ? (
            <p className="dashboard-upcoming__empty">Cuando agendes una cita, la encontrarás aquí.</p>
          ) : (
            <div className="dashboard-upcoming__list">
              {sortedAppointments.map((appointment) => (
                <article className="dashboard-upcoming__item" key={appointment.id}>
                  <div className="dashboard-upcoming__date">
                    <strong>{new Intl.DateTimeFormat('es-EC', {
                      day: '2-digit'
                    }).format(appointmentDateObject(appointment.date))}</strong>
                    <span>{new Intl.DateTimeFormat('es-EC', {
                      month: 'short'
                    }).format(appointmentDateObject(appointment.date))}</span>
                  </div>
                  <div className="dashboard-upcoming__details">
                    <h3>Reunión de planificación · {appointment.time}</h3>
                    <p>{appointment.topic}</p>
                    {appointment.serviceName && <p>Servicio: {appointment.serviceName}</p>}
                    <span>
                      {appointment.status === 'confirmed'
                        ? 'Cita confirmada'
                        : appointment.status === 'cancelled'
                          ? 'Cita cancelada'
                          : 'Pendiente de confirmación'}
                    </span>
                    {appointment.zoomJoinUrl && (
                      <a
                        className="dashboard-upcoming__zoom"
                        href={appointment.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Entrar a la reunión de Zoom
                      </a>
                    )}
                  </div>
                  <button
                    className="dashboard-upcoming__view"
                    type="button"
                    onClick={() => {
                      setSelectedDate(appointment.date);
                      const [year, month] = appointment.date.split('-').map(Number);
                      setCalendarMonth(new Date(year, month - 1, 1));
                    }}
                  >
                    Ver en calendario
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-inspiration" aria-labelledby="inspiration-title">
          <div className="dashboard-inspiration__intro">
            <span className="dashboard-inspiration__icon" aria-hidden="true">✦</span>
            <span className="client-dashboard__eyebrow">UN POCO DE INSPIRACIÓN</span>
            <h2 className="font-titulo" id="inspiration-title">¿Buscamos ideas para tu evento?</h2>
            <p>
              Cuéntame qué estás imaginando y exploremos estilos, colores y detalles para tu celebración.
            </p>
          </div>

          <form className="dashboard-inspiration__search" onSubmit={handleIdeaSearch}>
            <label htmlFor="idea-query">¿Qué tipo de evento o estilo tienes en mente?</label>
            <div className="dashboard-inspiration__search-field">
              <input
                id="idea-query"
                type="search"
                value={ideaQuery}
                onChange={(event) => setIdeaQuery(event.target.value)}
                placeholder="Ej.: cumpleaños infantil con tema de mariposas"
                maxLength="160"
              />
              <button type="submit" disabled={!ideaQuery.trim() || inspirationLoading}>
                {inspirationLoading ? 'Creando propuesta…' : 'Crear mi propuesta'}
                {!inspirationLoading && <span aria-hidden="true">↗</span>}
              </button>
            </div>
            <div className="dashboard-inspiration__suggestions" aria-label="Ideas para probar">
              <span>Prueba:</span>
              {['fiesta infantil', 'boda íntima', 'mesa de dulces'].map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => setIdeaQuery(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </form>

          <div className="dashboard-inspiration__results" aria-live="polite">
            <div className="dashboard-inspiration__results-heading">
              <div>
                <span className="client-dashboard__eyebrow">PROPUESTA PERSONALIZADA</span>
                <h3>{activeIdeaQuery ? `Inspiración para “${activeIdeaQuery}”` : 'Tu propuesta aparecerá aquí'}</h3>
              </div>
              <span className="dashboard-inspiration__badge">Asistente creativo IA</span>
            </div>

            {inspirationLoading && (
              <div className="dashboard-inspiration__loading" role="status">
                <span aria-hidden="true">✦</span>
                Estoy preparando una idea especial y buscando referencias visuales…
              </div>
            )}
            {inspirationError && (
              <p className="dashboard-inspiration__error" role="alert">{inspirationError}</p>
            )}
            {inspiration && (
              <>
                <CreativeProposalCard proposal={inspiration} />
                <div className="dashboard-inspiration__visuals">
                  <div className="dashboard-inspiration__visuals-heading">
                    <div>
                      <span className="client-dashboard__eyebrow">BÚSQUEDAS SUGERIDAS POR GEMINI</span>
                      <h4>Explora referencias en Pinterest</h4>
                    </div>
                  </div>
                  <PinterestSearchLinks links={inspiration.links} />
                </div>
                <div className="dashboard-inspiration__choose">
                  <p>
                    ¿Te gustaría conversar esta propuesta con el equipo en una reunión de Zoom?
                  </p>
                  <button type="button" onClick={handleSelectProposal}>
                    {selectedProposal?.query === activeIdeaQuery
                      ? 'Idea incluida en tu cita'
                      : 'Incluir esta idea en mi cita'}
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="dashboard-inspiration__note">
            Gemini propone ideas y búsquedas para explorar en Pinterest. También puedes adjuntar tus propias imágenes al agendar.
          </p>
        </section>
      </div>
    </main>
  );
}

function AppointmentIdeaImages({ appointment }) {
  const descriptors = JSON.stringify((appointment.ideaImages || []).map(({ id, fileName }) => ({
    id,
    fileName,
  })));
  const [imageUrls, setImageUrls] = useState({});
  const [loadedDescriptors, setLoadedDescriptors] = useState('');
  const [imageError, setImageError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const createdUrls = [];
    let active = true;
    const images = JSON.parse(descriptors);

    Promise.all(images.map(async (image) => {
      const response = await fetch(
        `${API_BASE_URL}/api/appointments/${appointment.id}/idea-images/${image.id}`,
        { credentials: 'include', signal: controller.signal }
      );
      if (!response.ok) {
        throw new Error('No se pudieron cargar las imágenes de referencia.');
      }
      const imageUrl = URL.createObjectURL(await response.blob());
      createdUrls.push(imageUrl);
      return [image.id, imageUrl];
    }))
      .then((entries) => {
        if (active) {
          setImageUrls(Object.fromEntries(entries));
          setLoadedDescriptors(descriptors);
          setImageError(null);
        }
      })
      .catch((error) => {
        createdUrls.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
        if (active && error.name !== 'AbortError') {
          setImageError({
            descriptors,
            message: error.message || 'No se pudieron cargar las imágenes de referencia.',
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
      createdUrls.forEach((imageUrl) => URL.revokeObjectURL(imageUrl));
    };
  }, [appointment.id, descriptors]);

  const images = JSON.parse(descriptors);
  const imagesLoaded = loadedDescriptors === descriptors;
  return (
    <section className="admin-appointment__idea-images">
      <strong>Imágenes de referencia del cliente</strong>
      {imageError?.descriptors === descriptors && <p role="alert">{imageError.message}</p>}
      <div>
        {images.map((image) => (
          <a
            href={imagesLoaded ? imageUrls[image.id] : undefined}
            download={image.fileName}
            key={image.id}
            aria-label={`Descargar imagen de referencia: ${image.fileName}`}
          >
            {imagesLoaded && imageUrls[image.id] ? (
              <img
                src={imageUrls[image.id]}
                alt={`Referencia enviada: ${image.fileName}`}
                loading="lazy"
              />
            ) : (
              <span className="admin-appointment__idea-image-loading">
                Cargando imagen…
              </span>
            )}
            <span>{image.fileName}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function AdminDashboard({
  appointments,
  appointmentsError,
  zoomConfigured,
  zoomStatusError,
  updatingAppointmentId,
  onUpdateAppointment,
  onResendZoomEmail,
  onLogout
}) {
  const [filter, setFilter] = useState('all');
  const filteredAppointments = [...appointments]
    .filter((appointment) => filter === 'all' || appointment.status === filter)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length;
  const confirmedCount = appointments.filter((appointment) => appointment.status === 'confirmed').length;

  return (
    <main className="admin-dashboard">
      <header className="client-dashboard__header">
        <a className="client-dashboard__brand" href="#inicio" aria-label="Party Everyday, ir al inicio">
          <img src={logo} alt="Party Everyday" />
        </a>
        <div className="admin-dashboard__header-user">
          <span className="admin-dashboard__role">Administración</span>
          <button type="button" onClick={onLogout}>Salir del panel</button>
        </div>
      </header>

      <div className="admin-dashboard__content">
        <div className="admin-dashboard__welcome">
          <span className="client-dashboard__eyebrow">PANEL DE ADMINISTRACIÓN</span>
          <h1 className="font-titulo">Gestión de eventos</h1>
          <p>Revisa las solicitudes de cita y organiza el seguimiento de cada cliente.</p>
        </div>

        {appointmentsError && (
          <div className="admin-dashboard__demo-note" role="alert">{appointmentsError}</div>
        )}
        {zoomStatusError && (
         <div className="admin-dashboard__demo-note" role="alert">{zoomStatusError}</div>
        )}
        {zoomConfigured === false && (
         <div className="admin-dashboard__demo-note" role="note">
            Las citas se guardan en MongoDB. Para crear enlaces reales, configura las credenciales de Zoom en Backend/.env y reinicia el backend.
          </div>
        )}
        <section className="admin-dashboard__stats" aria-label="Resumen de citas">
          <article className="admin-stat">
            <span className="admin-stat__icon" aria-hidden="true">▦</span>
            <div><span>Total de citas</span><strong>{appointments.length}</strong></div>
          </article>
          <article className="admin-stat admin-stat--pending">
            <span className="admin-stat__icon" aria-hidden="true">◷</span>
            <div><span>Pendientes</span><strong>{pendingCount}</strong></div>
          </article>
          <article className="admin-stat admin-stat--confirmed">
            <span className="admin-stat__icon" aria-hidden="true">✓</span>
            <div><span>Confirmadas</span><strong>{confirmedCount}</strong></div>
          </article>
        </section>

        <section className="admin-appointments" aria-labelledby="admin-appointments-title">
          <div className="admin-appointments__heading">
            <div>
              <span className="client-dashboard__eyebrow">AGENDA DE CLIENTES</span>
              <h2 id="admin-appointments-title">Solicitudes de cita</h2>
            </div>
            <label className="admin-appointments__filter">
              Filtrar
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </label>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="admin-appointments__empty">
              <span aria-hidden="true">✧</span>
              <h3>{appointments.length === 0 ? 'Aún no hay solicitudes' : 'No hay citas en este filtro'}</h3>
              <p>
                {appointments.length === 0
                  ? 'Cuando se solicite una cita, aquí aparecerán la fecha, el tema y los datos del cliente.'
                  : 'Prueba con otro estado para ver las solicitudes.'}
              </p>
            </div>
          ) : (
            <div className="admin-appointments__list">
              {filteredAppointments.map((appointment) => (
                <article className="admin-appointment" key={appointment.id}>
                  <div className="admin-appointment__date">
                    <strong>{new Intl.DateTimeFormat('es-EC', { day: '2-digit' }).format(appointmentDateObject(appointment.date))}</strong>
                    <span>{new Intl.DateTimeFormat('es-EC', { month: 'short' }).format(appointmentDateObject(appointment.date))}</span>
                  </div>
                  <div className="admin-appointment__details">
                    <div className="admin-appointment__title">
                      <h3>Reunión por Zoom · {appointment.time}</h3>
                      <span className={`admin-appointment__status admin-appointment__status--${appointment.status}`}>
                        {appointment.status === 'confirmed' ? 'Confirmada' : appointment.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="admin-appointment__client">{appointment.clientName} · {appointment.clientEmail}</p>
                    <p>{appointment.topic}</p>
                    {appointment.serviceName && <p>Servicio elegido: {appointment.serviceName}</p>}
                    {appointment.creativeProposal && (
                      <section className="admin-appointment__proposal">
                        <article className="admin-proposal-brief">
                          <span className="client-dashboard__eyebrow">GUÍA INTERNA PARA LA REUNIÓN</span>
                          <h4>{appointment.creativeProposal.title || 'Preparación de la propuesta'}</h4>
                          {appointment.adminBrief ? (
                            <>
                              <p>{appointment.adminBrief.summary}</p>
                              <section>
                                <h5>Materiales sugeridos</h5>
                                <ul>
                                  {appointment.adminBrief.materials.map((item, index) => (
                                    <li key={`${index}-${item}`}>{item}</li>
                                  ))}
                                </ul>
                              </section>
                              <section>
                                <h5>Montaje propuesto</h5>
                                <ol>
                                  {appointment.adminBrief.setupSteps.map((step, index) => (
                                    <li key={`${index}-${step}`}>{step}</li>
                                  ))}
                                </ol>
                              </section>
                              <section>
                                <h5>Preguntas para Zoom</h5>
                                <ul>
                                  {appointment.adminBrief.zoomQuestions.map((question, index) => (
                                    <li key={`${index}-${question}`}>{question}</li>
                                  ))}
                                </ul>
                              </section>
                            </>
                          ) : (
                            <p>Esta cita se agendó antes de que estuviera disponible la guía interna.</p>
                          )}
                        </article>
                        <PinterestSearchLinks
                          links={appointment.creativeProposal.links}
                          className="admin-appointment__proposal-links"
                        />
                      </section>
                    )}
                    {appointment.ideaImages?.length > 0 && (
                      <AppointmentIdeaImages appointment={appointment} />
                    )}
                    {appointment.zoomJoinUrl ? (
                      <>
                        <a className="admin-appointment__zoom" href={appointment.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                          Abrir reunión de Zoom
                        </a>
                        <p className="admin-appointment__email-status">
                          {appointment.zoomEmailSent
                            ? 'Correo con el enlace enviado al cliente.'
                            : appointment.zoomEmailFailed
                              ? 'No se pudo enviar el correo al cliente.'
                                : 'Correo pendiente de envío.'}
                        </p>
                      </>
                    ) : (
                      <span className="admin-appointment__zoom">
                        {appointment.status === 'pending'
                          ? 'Al confirmar se creará el enlace de Zoom.'
                          : 'No hay enlace de Zoom asociado.'}
                      </span>
                    )}
                  </div>
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <div className="admin-appointment__actions">
                      {appointment.status === 'pending' && (
                        <button
                          type="button"
                          className="admin-appointment__confirm"
                          disabled={updatingAppointmentId === appointment.id}
                          onClick={() => onUpdateAppointment(appointment.id, 'confirmed')}
                        >
                          {updatingAppointmentId === appointment.id ? 'Creando enlace…' : 'Confirmar'}
                        </button>
                      )}
                      {appointment.status === 'confirmed' && !appointment.zoomEmailSent && (
                        <button
                          type="button"
                          className="admin-appointment__confirm"
                          disabled={updatingAppointmentId === appointment.id}
                          onClick={() => onResendZoomEmail(appointment.id)}
                        >
                          {updatingAppointmentId === appointment.id
                            ? 'Enviando correo…'
                            : appointment.zoomEmailFailed
                              ? 'Reintentar correo'
                              : 'Enviar link por correo'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-appointment__cancel"
                        disabled={updatingAppointmentId === appointment.id}
                        onClick={() => onUpdateAppointment(appointment.id, 'cancelled')}
                      >
                        {updatingAppointmentId === appointment.id ? 'Procesando…' : 'Cancelar'}
                      </button>
                    </div>
                  )}
                  {appointment.status === 'cancelled' && (
                    <button
                      type="button"
                      className="admin-appointment__confirm"
                      disabled={updatingAppointmentId === appointment.id}
                      onClick={() => onUpdateAppointment(appointment.id, 'pending')}
                    >
                      Reabrir solicitud
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function App() {
  const imagenesFondo = [foto1, foto2, foto3];
  const [indiceActual, setIndiceActual] = useState(0);
  const [authMode, setAuthMode] = useState(() => (
    new URLSearchParams(window.location.search).has('resetPassword') ? 'reset' : null
  ));
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [resetToken] = useState(() => (
    new URLSearchParams(window.location.search).get('resetPassword') || ''
  ));
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState('');
  const [zoomConfigured, setZoomConfigured] = useState(null);
  const [zoomStatusError, setZoomStatusError] = useState('');

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prevIndice) => (prevIndice + 1) % imagenesFondo.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [imagenesFondo.length]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const verificationToken = params.get('verifyEmail');
    const passwordToken = params.get('resetPassword');

    if (verificationToken) {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
      fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken })
      })
        .then(readApiResponse)
        .then(({ message }) => {
          if (active) {
            setAuthMode('login');
            setAuthNotice(message);
            setAuthError('');
          }
        })
        .catch((error) => {
          if (active) {
            setAuthMode('verify');
            setAuthError(error.message);
          }
        });
    } else if (passwordToken) {
      window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    }

    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then((response) => {
        if (response.status === 401) return null;
        return readApiResponse(response).then(({ user }) => user);
      })
      .then((user) => {
        if (active) setLoggedInUser(user);
      })
      .catch(() => {
        if (active) {
          setLoggedInUser(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/health`)
      .then(readApiResponse)
      .then(({ zoomConfigured: zoomIsConfigured }) => {
        if (active) {
          setZoomConfigured(zoomIsConfigured === true);
          setZoomStatusError('');
        }
      })
      .catch(() => {
        if (active) {
          setZoomConfigured(null);
          setZoomStatusError('No se pudo consultar el estado de Zoom en el servidor. Verifica la conexión con el backend e inténtalo de nuevo.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!loggedInUser) {
      return () => {
        active = false;
      };
    }

    const loadAppointments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/appointments`, { credentials: 'include' });
        const { appointments: savedAppointments } = await readApiResponse(response);
        if (active) {
          setAppointments(savedAppointments);
          setAppointmentsError('');
        }
      } catch (error) {
        if (active) {
          setAppointmentsError(error.message || 'No se pudieron cargar las citas.');
        }
      }
    };

    loadAppointments();
    const refreshInterval = loggedInUser.role === 'admin'
      ? setInterval(loadAppointments, 30000)
      : null;
    return () => {
      active = false;
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [loggedInUser]);

  useEffect(() => {
    if (!authMode) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setAuthMode(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authMode]);

  const servicios = [
    {
      titulo: 'DECORACIÓN CON GLOBOS',
      descripcion: 'Arcos, fondos y rincones llenos de color para celebrar a lo grande.',
      imagenes: [serv1_a, serv1_b],
      colorBarra: '#fbd3d9'
    },
    {
      titulo: 'MESAS DE DULCES & PASTELERÍA',
      descripcion: 'Un rincón delicioso con detalles pensados para sorprender a todos.',
      imagenes: [serv2_a, serv2_b],
      colorBarra: '#e28ca9'
    },
    {
      titulo: 'DISEÑO DE MESAS & FLORALES',
      descripcion: 'Mesas especiales, flores y pequeños detalles que crean el ambiente.',
      imagenes: [serv3_a, serv3_b],
      colorBarra: '#f4b6c2'
    }
  ];

  const openAuth = (mode) => {
    setAuthError('');
    setAuthNotice('');
    setShowPassword(false);
    setAuthMode(mode);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || authEmail).trim();
    const password = String(formData.get('password') || '');
    const isRegister = authMode === 'register';
    setAuthError('');
    setAuthNotice('');
    setAuthSubmitting(true);

    try {
      if (authMode === 'reset') {
        const passwordConfirmation = String(formData.get('passwordConfirmation') || '');
        if (password !== passwordConfirmation) {
          throw new Error('Las contraseñas no coinciden.');
        }
        const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(resetToken
              ? { token: resetToken }
              : { email, code: String(formData.get('code') || '').trim() }),
            password,
          })
        });
        const { message } = await readApiResponse(response);
        setAuthMode('login');
        setAuthNotice(message);
        return;
      }

      if (authMode === 'forgot') {
        const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const { message } = await readApiResponse(response);
        setAuthEmail(email);
        setAuthMode('reset');
        setAuthNotice(message);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isRegister ? { name: String(formData.get('name') || '').trim() } : {}),
          email,
          password,
          ...(authMode === 'admin' ? { admin: true } : {})
        })
      });
      const result = await readApiResponse(response);
      setAuthEmail(email);
      if (isRegister) {
        setAuthMode('login');
        setAuthNotice(result.message);
        return;
      }
      const { user } = result;
      if (authMode === 'admin' && user.role !== 'admin') {
        throw new Error('Esta cuenta no tiene permisos de administración.');
      }
      setLoggedInUser(user);
      setAuthMode(null);
    } catch (error) {
      setAuthError(error.message || 'No se pudo conectar con el servidor.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError('');
    setAuthNotice('');
    setAuthSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const { message } = await readApiResponse(response);
      setAuthNotice(message);
    } catch (error) {
      setAuthError(error.message || 'No se pudo enviar el correo.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).then(readApiResponse);
    } catch (error) {
      setAuthError(error.message || 'No se pudo cerrar la sesión en el servidor.');
      setAuthMode('login');
    } finally {
      setLoggedInUser(null);
      setAppointments([]);
      setAppointmentsError('');
    }
  };

  const handleUpdateAppointment = async (appointmentId, status) => {
    setAppointmentsError('');
    setUpdatingAppointmentId(appointmentId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const { appointment } = await readApiResponse(response);
      setAppointments((current) => current.map((item) => (
        item.id === appointment.id ? appointment : item
      )));
    } catch (error) {
      setAppointmentsError(error.message || 'No se pudo actualizar la cita.');
    } finally {
      setUpdatingAppointmentId('');
    }
  };

  const handleResendZoomEmail = async (appointmentId) => {
    setAppointmentsError('');
    setUpdatingAppointmentId(appointmentId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/notification`, {
        method: 'POST',
        credentials: 'include'
      });
      const { appointment } = await readApiResponse(response);
      setAppointments((current) => current.map((item) => (
        item.id === appointment.id ? appointment : item
      )));
    } catch (error) {
      setAppointmentsError(error.message || 'No se pudo enviar el correo con el enlace de Zoom.');
    } finally {
      setUpdatingAppointmentId('');
    }
  };

  const handleBookAppointment = async (appointment) => {
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment)
    });
    const { appointment: savedAppointment } = await readApiResponse(response);
    setAppointments((current) => [...current, savedAppointment]);
    setAppointmentsError('');
    return savedAppointment;
  };

  if (loggedInUser?.role === 'admin') {
    return (
      <AdminDashboard
        appointments={appointments}
        appointmentsError={appointmentsError}
        zoomConfigured={zoomConfigured}
        zoomStatusError={zoomStatusError}
        updatingAppointmentId={updatingAppointmentId}
        onUpdateAppointment={handleUpdateAppointment}
        onResendZoomEmail={handleResendZoomEmail}
        onLogout={handleLogout}
      />
    );
  }

  if (loggedInUser) {
    return (
      <ClientDashboard
        user={loggedInUser}
        appointments={appointments}
        appointmentsError={appointmentsError}
        onBookAppointment={handleBookAppointment}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="public-site">
      <Navbar />
      {authError && !authMode && (
        <p className="auth-page-error" role="alert">{authError}</p>
      )}

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
              key={serv.titulo}
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
              <span className="quote-contact__eyebrow">TU ESPACIO ESPECIAL</span>
              <h3>Planeemos tu celebración</h3>
              <p>Crea tu cuenta para guardar tus ideas o inicia sesión para continuar.</p>
              <div className="quote-contact__actions">
                <button className="quote-contact__button" type="button" onClick={() => openAuth('register')}>
                  Crear cuenta <span aria-hidden="true">↗</span>
                </button>
                <button
                  className="quote-contact__login"
                  type="button"
                  onClick={() => openAuth('login')}
                >
                  Ya tengo cuenta · Iniciar sesión
                </button>
              </div>
              <span className="quote-contact__note">Tu espacio personal para planear cada detalle</span>
              <button
                className="quote-contact__admin-link"
                type="button"
                onClick={() => openAuth('admin')}
              >
                Acceso administrador
              </button>
            </aside>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contacto" aria-labelledby="contact-section-title">
        <div className="contact-section__inner">
          <h2 className="font-titulo" id="contact-section-title">Contacto</h2>
          <div className="contact-section__links">
            <a
              className="contact-section__link"
              href="https://www.facebook.com/share/19qenFrX96/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-section__icon" aria-hidden="true">f</span>
              <span>Facebook</span>
            </a>
            <a
              className="contact-section__link"
              href="https://www.instagram.com/partyeverydaydec?exln=NjhrNHM0NWhldDZo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="contact-section__icon contact-section__icon--instagram" aria-hidden="true">◎</span>
              <span>Instagram</span>
            </a>
            <a className="contact-section__link" href="tel:+593968668970">
              <span className="contact-section__icon contact-section__icon--phone" aria-hidden="true">☎</span>
              <span>+593 968 668 970</span>
            </a>
          </div>
          <p className="contact-section__privacy">
            <a href="/politica-de-privacidad.html">Política de privacidad</a>
          </p>
        </div>
      </section>

      {authMode && (
        <div className="auth-modal-backdrop">
          <section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <span className="auth-modal__decorations" aria-hidden="true">
              <span className="auth-modal__decoration auth-modal__decoration--star">✦</span>
              <span className="auth-modal__decoration auth-modal__decoration--twinkle">✧</span>
              <span className="auth-modal__decoration auth-modal__decoration--sparkle">✳</span>
              <span className="auth-modal__decoration auth-modal__decoration--confetti auth-modal__decoration--pink" />
              <span className="auth-modal__decoration auth-modal__decoration--confetti auth-modal__decoration--blue" />
              <span className="auth-modal__decoration auth-modal__decoration--dot" />
              <span className="auth-modal__decoration auth-modal__decoration--bottom-star">✧</span>
            </span>
            <button
              className="auth-modal__close"
              type="button"
              aria-label="Cerrar"
              onClick={() => setAuthMode(null)}
            >
              ×
            </button>
            <span className="auth-modal__eyebrow">PARTY EVERYDAY</span>
            <h2 id="auth-modal-title">
              {authMode === 'register'
                ? 'Crea tu cuenta'
                : authMode === 'admin'
                  ? 'Acceso de administración'
                  : authMode === 'forgot'
                    ? 'Recupera tu contraseña'
                    : authMode === 'reset'
                      ? 'Crea una contraseña nueva'
                      : authMode === 'verify'
                        ? 'Verifica tu correo'
                        : 'Qué gusto verte de nuevo'}
            </h2>
            <p className="auth-modal__intro">
              {authMode === 'register'
                ? 'Completa tus datos para crear tu cuenta.'
                : authMode === 'admin'
                  ? 'Ingresa con la cuenta autorizada para administrar Party Everyday.'
                  : authMode === 'forgot'
                      ? 'Escribe el correo de tu cuenta y te enviaremos un código para cambiar la contraseña.'
                    : authMode === 'reset'
                        ? 'Ingresa el código que enviamos a tu correo y elige una contraseña nueva.'
                      : authMode === 'verify'
                          ? `Te enviaremos un enlace a ${authEmail || 'tu correo'}.`
                        : 'Inicia sesión para continuar con los detalles de tu celebración.'}
            </p>
            {authMode === 'verify' ? (
              <div className="auth-modal__form">
                {authError && <p className="auth-modal__notice" role="alert">{authError}</p>}
                {authNotice && <p className="auth-modal__notice auth-modal__notice--success" role="status">{authNotice}</p>}
                {!authEmail && (
                  <label>
                    Correo electrónico
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      required
                    />
                  </label>
                )}
                <button
                  className="auth-modal__submit"
                  type="button"
                  disabled={authSubmitting || !authEmail}
                  onClick={handleResendVerification}
                >
                  {authSubmitting ? 'Enviando…' : 'Reenviar correo de verificación'}
                </button>
                <button className="auth-modal__text-button" type="button" onClick={() => openAuth('login')}>
                  Volver a iniciar sesión
                </button>
              </div>
            ) : (
              <form className="auth-modal__form" onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <label>
                    Nombre
                    <input autoFocus type="text" name="name" autoComplete="name" placeholder="Tu nombre" required />
                  </label>
                )}
                {authMode !== 'reset' && (
                  <label>
                    Correo electrónico
                    <input
                      autoFocus={authMode === 'login' || authMode === 'forgot'}
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      defaultValue={authEmail}
                      required
                    />
                  </label>
                )}
                {authMode === 'reset' && !resetToken && (
                  <>
                    <label>
                      Correo electrónico
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        defaultValue={authEmail}
                        required
                      />
                    </label>
                    <label>
                      Código de recuperación
                      <input
                        type="text"
                        name="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{8}"
                        maxLength={8}
                        placeholder="8 dígitos"
                        required
                      />
                    </label>
                  </>
                )}
                {['register', 'login', 'admin', 'reset'].includes(authMode) && (
                  <>
                    <div className="auth-modal__password-group">
                      <label htmlFor="auth-password">{authMode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}</label>
                      <div className="auth-modal__password-field">
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          autoComplete={authMode === 'register' || authMode === 'reset' ? 'new-password' : 'current-password'}
                          placeholder="••••••••"
                          minLength={8}
                          maxLength={72}
                          required
                        />
                        <button
                          className="auth-modal__password-toggle"
                          type="button"
                          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((visible) => !visible)}
                        >
                          {showPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                    </div>
                    {authMode === 'reset' && (
                      <label>
                        Confirmar contraseña nueva
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="passwordConfirmation"
                          autoComplete="new-password"
                          minLength={8}
                          maxLength={72}
                          required
                        />
                      </label>
                    )}
                  </>
                )}
                {authMode === 'admin' && (
                  <p className="auth-modal__backend-note">
                    El acceso requiere una cuenta con rol de administrador.
                  </p>
                )}
                {authMode === 'login' && (
                  <>
                    <div className="auth-modal__forgot-password">
                      <span aria-hidden="true">✦</span>
                      <button type="button" onClick={() => openAuth('forgot')}>
                        ¿Olvidaste tu contraseña?
                        <span className="auth-modal__forgot-arrow" aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </>
                )}
                {authError && <p className="auth-modal__notice" role="alert">{authError}</p>}
                {authNotice && <p className="auth-modal__notice auth-modal__notice--success" role="status">{authNotice}</p>}
                <button className="auth-modal__submit" type="submit" disabled={authSubmitting}>
                  {authMode === 'register'
                    ? authSubmitting ? 'Enviando verificación…' : 'Crear cuenta'
                    : authMode === 'admin'
                      ? authSubmitting ? 'Verificando…' : 'Ingresar como administrador'
                      : authMode === 'forgot'
                        ? authSubmitting ? 'Enviando…' : 'Enviar código de recuperación'
                        : authMode === 'reset'
                          ? authSubmitting ? 'Guardando…' : 'Guardar contraseña nueva'
                          : authSubmitting ? 'Verificando…' : 'Iniciar sesión'}
                </button>
              </form>
            )}
            {['login', 'register'].includes(authMode) && (
              <p className="auth-modal__switch">
                {authMode === 'register' ? '¿Ya verificaste tu correo?' : '¿Aún no tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => openAuth(authMode === 'register' ? 'login' : 'register')}
                >
                  {authMode === 'register' ? 'Inicia sesión' : 'Crear cuenta'}
                </button>
              </p>
            )}
          </section>
        </div>
      )}

    </div>
  );
}

export default App;