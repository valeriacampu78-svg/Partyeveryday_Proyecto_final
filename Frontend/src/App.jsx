import { useState, useEffect } from 'react';
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

function ClientDashboard({ user, appointments, onBookAppointment, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(dateToInputValue(new Date()));
  const [ideaQuery, setIdeaQuery] = useState('');
  const [activeIdeaQuery, setActiveIdeaQuery] = useState('una celebración inolvidable');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [bookingNotice, setBookingNotice] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');

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
  const inspirationIdeas = [
    {
      title: 'Decoración con globos',
      description: 'Arcos orgánicos, tonos suaves y un rincón perfecto para las fotos.',
      symbol: '✦',
      pinterestTerms: 'decoración con globos para eventos'
    },
    {
      title: 'Mesa de dulces',
      description: 'Una mesa deliciosa con colores coordinados y detalles personalizados.',
      symbol: '❀',
      pinterestTerms: 'mesa de dulces decorada para fiestas'
    },
    {
      title: 'Mesas y flores',
      description: 'Flores, texturas y pequeños detalles para crear un ambiente especial.',
      symbol: '✿',
      pinterestTerms: 'decoración floral de mesas para eventos'
    }
  ];
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

  const handleBookingSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const appointment = {
      id: `${Date.now()}`,
      date: formData.get('appointmentDate'),
      time: formData.get('appointmentTime'),
      topic: formData.get('appointmentTopic').trim()
    };

    if (appointments.some((existing) => (
      existing.date === appointment.date && existing.time === appointment.time
    ))) {
      setBookingNotice('Ya tienes una cita de demostración en ese horario. Elige otra hora.');
      setBookingMessage('');
      return;
    }

    onBookAppointment(appointment);
    setSelectedDate(appointment.date);
    setBookingNotice('');
    setBookingMessage('Tu cita de demostración quedó agregada al calendario.');
    event.currentTarget.reset();
  };

  const handleIdeaSearch = (event) => {
    event.preventDefault();
    const query = ideaQuery.trim();
    if (query) setActiveIdeaQuery(query);
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
          Prototipo de demostración: las citas se guardan solo mientras esta página siga abierta.
          La integración real con Zoom y el guardado permanente se conectarán con el backend.
        </div>

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
                      <span>Enlace de Zoom disponible al conectar el backend</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="dashboard-card dashboard-booking" aria-labelledby="booking-title">
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
              <label>
                Hora (Ecuador)
                <select name="appointmentTime" defaultValue="10:00" required>
                  {Array.from({ length: 17 }, (_, index) => {
                    const minutes = 9 * 60 + index * 30;
                    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
                    return <option value={time} key={time}>{time}</option>;
                  })}
                </select>
              </label>
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
              {bookingNotice && <p className="dashboard-booking__message is-error" role="alert">{bookingNotice}</p>}
              {bookingMessage && <p className="dashboard-booking__message" role="status">{bookingMessage}</p>}
              <button className="dashboard-booking__submit" type="submit">
                Agendar cita de demostración <span aria-hidden="true">↗</span>
              </button>
            </form>
            <p className="dashboard-booking__note">
              Por ahora la cita es una vista previa: no se enviará invitación ni se creará un enlace real de Zoom.
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
                    <span>Por Zoom · vista previa</span>
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
              <button type="submit" disabled={!ideaQuery.trim()}>
                Buscar ideas <span aria-hidden="true">↗</span>
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
                <span className="client-dashboard__eyebrow">IDEAS PARA EXPLORAR</span>
                <h3>{activeIdeaQuery ? `Inspiración para “${activeIdeaQuery}”` : 'Elige una idea para comenzar'}</h3>
              </div>
              <span className="dashboard-inspiration__badge">Vista previa</span>
            </div>

            <div className="dashboard-inspiration__cards">
              {inspirationIdeas.map((idea) => {
                const pinterestQuery = encodeURIComponent(`${activeIdeaQuery} ${idea.pinterestTerms}`);
                return (
                  <article className="dashboard-inspiration-card" key={idea.title}>
                    <div className="dashboard-inspiration-card__art" aria-hidden="true">
                      <span>{idea.symbol}</span>
                      <span>✧</span>
                      <span>✦</span>
                    </div>
                    <div className="dashboard-inspiration-card__content">
                      <h4>{idea.title}</h4>
                      <p>{idea.description}</p>
                      <a
                        href={`https://www.pinterest.com/search/pins/?q=${pinterestQuery}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver ideas en Pinterest <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <p className="dashboard-inspiration__note">
            Esta es una vista previa: las sugerencias son ejemplos del sitio y los botones abren búsquedas en Pinterest.
            La consulta a una IA y la selección automática de ideas estarán disponibles al conectar el backend.
          </p>
        </section>
      </div>
    </main>
  );
}

function AdminDashboard({ appointments, onUpdateAppointment, onLogout }) {
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

        <div className="admin-dashboard__demo-note" role="note">
          <span aria-hidden="true">✦</span>
          Panel de demostración: solo verás las citas creadas en esta sesión. El acceso seguro y los datos compartidos se conectarán al backend.
        </div>

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
                  ? 'Cuando un cliente agende una cita en esta sesión, aquí aparecerán la fecha, el tema y sus datos.'
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
                    <span className="admin-appointment__zoom">El enlace de Zoom se habilitará al conectar el backend.</span>
                  </div>
                  {appointment.status === 'pending' && (
                    <div className="admin-appointment__actions">
                      <button
                        type="button"
                        className="admin-appointment__confirm"
                        onClick={() => onUpdateAppointment(appointment.id, 'confirmed')}
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className="admin-appointment__cancel"
                        onClick={() => onUpdateAppointment(appointment.id, 'cancelled')}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                  {appointment.status === 'cancelled' && (
                    <button
                      type="button"
                      className="admin-appointment__confirm"
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
  const [authMode, setAuthMode] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndiceActual((prevIndice) => (prevIndice + 1) % imagenesFondo.length);
    }, 4000);
    return () => clearInterval(intervalo);
  }, [imagenesFondo.length]);

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
    setAuthMode(mode);
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email')).trim();
    if (authMode === 'admin') {
      setAdminLoggedIn(true);
      setAuthMode(null);
      return;
    }

    const providedName = String(formData.get('name') || '').trim();
    setLoggedInUser({
      name: providedName || email.split('@')[0],
      email
    });
    setAuthMode(null);
  };

  const handleUpdateAppointment = (appointmentId, status) => {
    setAppointments((current) => current.map((appointment) => (
      appointment.id === appointmentId ? { ...appointment, status } : appointment
    )));
  };

  if (adminLoggedIn) {
    return (
      <AdminDashboard
        appointments={appointments}
        onUpdateAppointment={handleUpdateAppointment}
        onLogout={() => setAdminLoggedIn(false)}
      />
    );
  }

  if (loggedInUser) {
    return (
      <ClientDashboard
        user={loggedInUser}
        appointments={appointments}
        onBookAppointment={(appointment) => setAppointments((current) => [...current, {
          ...appointment,
          clientName: loggedInUser.name,
          clientEmail: loggedInUser.email,
          status: 'pending'
        }])}
        onLogout={() => setLoggedInUser(null)}
      />
    );
  }

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
              <span className="quote-contact__note">Entra al espacio de demostración</span>
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
                  : 'Qué gusto verte de nuevo'}
            </h2>
            <p className="auth-modal__intro">
              {authMode === 'register'
                ? 'Guarda tus ideas y empieza a planear una celebración inolvidable.'
                : authMode === 'admin'
                  ? 'Ingresa al panel de demostración para revisar y gestionar las solicitudes de cita.'
                  : 'Inicia sesión para continuar con los detalles de tu celebración.'}
            </p>
            <form className="auth-modal__form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <label>
                  Nombre
                  <input autoFocus type="text" name="name" autoComplete="name" placeholder="Tu nombre" required />
                </label>
              )}
              <label>
                Correo electrónico
                <input
                  autoFocus={authMode === 'login'}
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  name="password"
                  autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  required
                />
              </label>
              <p className="auth-modal__backend-note">
                {authMode === 'admin'
                  ? 'Modo de demostración: este acceso no está protegido y los datos solo existen en esta sesión.'
                  : 'Modo de demostración: podrás explorar el calendario y agendar citas de prueba. Aún no se crean cuentas reales.'}
              </p>
              <button className="auth-modal__submit" type="submit">
                {authMode === 'register'
                  ? 'Entrar al espacio de prueba'
                  : authMode === 'admin'
                    ? 'Entrar al panel de demostración'
                    : 'Iniciar sesión de prueba'}
              </button>
            </form>
            {authMode !== 'admin' && (
              <p className="auth-modal__switch">
                {authMode === 'register' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
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