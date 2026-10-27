import { useState } from 'react'
import Navbar from './Componentes/Navbar'
import './App.css'

function App() {
  return (
    <div>
      <Navbar />
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', textAlign: 'center' }}>
        <h1>¡Bienvenido a Party Everyday! 🎉</h1>
        <p>Tu plataforma ideal para la organización y decoración de eventos inolvidables.</p>
      </div>
    </div>
  )
}

export default App