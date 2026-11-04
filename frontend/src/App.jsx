
import { useEffect, useState } from 'react';
import Juegos from './Juegos';
import './App.css';

const API_URL = 'http://localhost:3001/api';

const iconos = {
  'Ubicación espacial': '🧩',
  'Figuras geométricas': '🔷',
  'Juego de memoria': '🧠',
  'Tablas de multiplicar': '✖️',
  'Suma de fracciones': '🍰',
  'Multiplicación decimal': '🔢'
};

function App() {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [nivel, setNivel] = useState('');

  const [estudiante, setEstudiante] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [resultado, setResultado] = useState(null);

  const [pantalla, setPantalla] = useState('actividades');
  const [progreso, setProgreso] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [cargandoActividades, setCargandoActividades] = useState(false);
  const [cargandoProgreso, setCargandoProgreso] = useState(false);
  const [guardandoResultado, setGuardandoResultado] = useState(false);

  const [error, setError] = useState('');
  const [errorActividades, setErrorActividades] = useState('');
  const [errorProgreso, setErrorProgreso] = useState('');

  // Obtener actividades desde MySQL
  async function obtenerActividades() {
    setCargandoActividades(true);
    setErrorActividades('');

    try {
      const respuesta = await fetch(`${API_URL}/actividades`);

      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar las actividades');
      }

      const datos = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error('Formato de actividades incorrecto');
      }

      setActividades(datos);
    } catch (err) {
      console.error('Error al obtener actividades:', err);
      setErrorActividades(
        err.message || 'No se pudieron cargar las actividades'
      );
    } finally {
      setCargandoActividades(false);
    }
  }

  useEffect(() => {
    if (estudiante?.id) {
      obtenerActividades();
    }
  }, [estudiante?.id]);

  // Registrar estudiante
  async function comenzar(e) {
    e.preventDefault();
    setError('');

    if (!nombre.trim() || !edad || !nivel) {
      setError('Completa todos los campos');
      return;
    }

    const edadNumero = Number(edad);

    if (
      !Number.isInteger(edadNumero) ||
      edadNumero < 3 ||
      edadNumero > 15
    ) {
      setError('La edad debe estar entre 3 y 15 años');
      return;
    }

    if (!['preprimario', 'primario'].includes(nivel)) {
      setError('Selecciona un nivel válido');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch(`${API_URL}/estudiantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          edad: edadNumero,
          nivel
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'Error al registrar estudiante'
        );
      }

      if (!datos.estudiante?.id) {
        throw new Error(
          'El servidor no devolvió el ID del estudiante'
        );
      }

      setEstudiante(datos.estudiante);
      setActividadSeleccionada(null);
      setResultado(null);
      setProgreso(null);
      setPantalla('actividades');

      console.log('Estudiante registrado:', datos.estudiante);
    } catch (err) {
      console.error('Error al registrar:', err);
      setError(
        err.message || 'No se pudo conectar con el servidor'
      );
    } finally {
      setCargando(false);
    }
  }

  // Guardar resultado de cada juego
  async function finalizarJuego(puntos, correctas, total) {
    if (guardandoResultado) return;

    if (!actividadSeleccionada || !estudiante?.id) {
      setErrorActividades(
        'No se pudo identificar al estudiante o la actividad'
      );
      return;
    }

    const puntuacion = Number(puntos);
    const respuestasCorrectas = Number(correctas);
    const totalPreguntas = Number(total);

    if (
      !Number.isFinite(puntuacion) ||
      !Number.isInteger(totalPreguntas) ||
      totalPreguntas <= 0 ||
      !Number.isInteger(respuestasCorrectas) ||
      respuestasCorrectas < 0 ||
      respuestasCorrectas > totalPreguntas
    ) {
      console.error('Resultado del juego inválido');
      return;
    }

    const actividadActual = actividadSeleccionada;

    setGuardandoResultado(true);

    const nuevoResultado = {
      actividad: actividadActual.nombre,
      puntos: Math.max(0, Math.min(100, Math.round(puntuacion))),
      correctas: respuestasCorrectas,
      total: totalPreguntas,
      guardado: false,
      errorGuardado: ''
    };

    try {
      const respuesta = await fetch(`${API_URL}/resultados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estudiante_id: estudiante.id,
          actividad_id: actividadActual.id,
          puntuacion: nuevoResultado.puntos,
          total_preguntas: totalPreguntas
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo guardar el resultado'
        );
      }

      console.log('Resultado guardado en MySQL:', datos);
      nuevoResultado.guardado = true;

      // Obligar a actualizar el progreso al consultarlo
      setProgreso(null);
    } catch (err) {
      console.error('Error al guardar resultado:', err);

      nuevoResultado.errorGuardado =
        err.message || 'Error de conexión con el servidor';
    } finally {
      setResultado(nuevoResultado);
      setActividadSeleccionada(null);
      setGuardandoResultado(false);
    }
  }

  // Consultar progreso del estudiante
  async function obtenerProgreso() {
    if (!estudiante?.id) {
      setErrorProgreso('No se encontró el ID del estudiante');
      return;
    }

    setPantalla('progreso');
    setCargandoProgreso(true);
    setErrorProgreso('');

    try {
      const respuesta = await fetch(
        `${API_URL}/resultados/estudiante/${estudiante.id}`
      );

      if (!respuesta.ok) {
        throw new Error('No se pudo consultar el progreso');
      }

      const datos = await respuesta.json();

      if (
        !datos ||
        !Array.isArray(datos.historial)
      ) {
        throw new Error('El servidor devolvió datos incorrectos');
      }

      setProgreso(datos);

      console.log('Progreso del estudiante:', datos);
    } catch (err) {
      console.error('Error al consultar progreso:', err);
      setErrorProgreso(
        err.message || 'No se pudo cargar el progreso'
      );
    } finally {
      setCargandoProgreso(false);
    }
  }

  function volverActividades() {
    if (guardandoResultado) return;

    setActividadSeleccionada(null);
    setResultado(null);
    setPantalla('actividades');
    setErrorActividades('');
  }

  function volverInicio() {
    if (guardandoResultado) return;

    setEstudiante(null);
    setActividadSeleccionada(null);
    setResultado(null);
    setProgreso(null);
    setPantalla('actividades');
    setActividades([]);
    setNombre('');
    setEdad('');
    setNivel('');
    setError('');
    setErrorActividades('');
    setErrorProgreso('');
  }

  const actividadesFiltradas = actividades.filter(
    actividad => actividad.nivel === estudiante?.nivel
  );

  function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return 'Fecha no disponible';
    }

    return fechaObjeto.toLocaleString('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  return (
    <main className="contenedor">
      <header>
        <div className="logo">🌈</div>
        <h1>AprendeJugando</h1>
        <p>¡Una aventura llena de aprendizaje!</p>
      </header>

      {!estudiante ? (
        <section className="tarjeta">
          <h2>¡Hola, pequeño explorador! 👋</h2>
          <p>Cuéntanos un poquito sobre ti.</p>

          <form onSubmit={comenzar}>
            <label htmlFor="nombre">Tu nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Escribe tu nombre"
              maxLength={100}
              required
            />

            <label htmlFor="edad">Tu edad</label>
            <input
              id="edad"
              type="number"
              min="3"
              max="15"
              value={edad}
              onChange={e => setEdad(e.target.value)}
              placeholder="¿Cuántos años tienes?"
              required
            />

            <label htmlFor="nivel">
              Tu nivel educativo
            </label>
            <select
              id="nivel"
              value={nivel}
              onChange={e => setNivel(e.target.value)}
              required
            >
              <option value="">Selecciona tu nivel</option>
              <option value="preprimario">Preprimario</option>
              <option value="primario">Primario</option>
            </select>

            {error && (
              <p role="alert" className="mensaje-error">
                {error}
              </p>
            )}

            <button type="submit" disabled={cargando}>
              {cargando
                ? 'Registrando...'
                : '¡Comenzar aventura! 🚀'}
            </button>
          </form>
        </section>
      ) : (
        <section className="tarjeta tarjeta-actividades">
          <h2>
            ¡Bienvenido, {estudiante.nombre}! 🎉
          </h2>

          <p>Edad: {estudiante.edad} años</p>

          <p>
            Nivel: {estudiante.nivel === 'primario'
              ? 'Primario'
              : 'Preprimario'}
          </p>

          {/* PANTALLA DE PROGRESO */}
          {pantalla === 'progreso' ? (
            <div className="pantalla-progreso">
              <div className="actividad-icono">🏆</div>

              <h2>Mi progreso</h2>

              <p>
                ¡Descubre cuánto has aprendido,
                {` ${estudiante.nombre}`}!
              </p>

              {cargandoProgreso && (
                <p role="status">
                  ⏳ Cargando tu progreso...
                </p>
              )}

              {errorProgreso && (
                <div>
                  <p role="alert" className="mensaje-error">
                    {errorProgreso}
                  </p>

                  <button
                    type="button"
                    onClick={obtenerProgreso}
                  >
                    🔄 Reintentar
                  </button>
                </div>
              )}

              {!cargandoProgreso &&
                !errorProgreso &&
                progreso && (
                  <>
                    <div className="resumen-progreso">
                      <div className="actividad-card">
                        <div className="actividad-icono">🎮</div>
                        <h3>Juegos completados</h3>
                        <h2>{progreso.total_juegos ?? 0}</h2>
                      </div>

                      <div className="actividad-card">
                        <div className="actividad-icono">⭐</div>
                        <h3>Promedio</h3>
                        <h2>
                          {Number(progreso.promedio ?? 0).toFixed(2)}%
                        </h2>
                      </div>

                      <div className="actividad-card">
                        <div className="actividad-icono">🏅</div>
                        <h3>Mejor puntuación</h3>
                        <h2>
                          {progreso.mejor_puntuacion ?? 0}%
                        </h2>
                      </div>
                    </div>

                    <h3>📚 Historial de actividades</h3>

                    {progreso.historial.length === 0 ? (
                      <p>
                        Todavía no tienes resultados guardados.
                        ¡Completa tu primer juego!
                      </p>
                    ) : (
                      <div className="historial-progreso">
                        {progreso.historial.map((item, indice) => (
                          <div
                            className="actividad-card"
                            key={item.id ?? indice}
                            style={{ marginBottom: '15px' }}
                          >
                            <div className="actividad-icono">
                              {iconos[item.actividad] || '🎯'}
                            </div>

                            <h3>
                              {item.actividad || 'Actividad'}
                            </h3>

                            <h2>
                              {item.puntuacion}/100
                            </h2>

                            <p>
                              Preguntas: {item.total_preguntas}
                            </p>

                            <p>
                              📅 {formatearFecha(item.fecha)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

              <button
                type="button"
                onClick={volverActividades}
              >
                🎮 Volver a las actividades
              </button>

              <button
                type="button"
                className="boton-volver"
                onClick={volverInicio}
              >
                🏠 Volver al inicio
              </button>
            </div>
          ) : resultado ? (
            /* RESULTADO DEL JUEGO */
            <div className="resultado-juego">
              <div className="actividad-icono">🏆</div>

              <h2>¡Actividad completada!</h2>
              <h3>{resultado.actividad}</h3>

              <h1>{resultado.puntos}/100</h1>

              <p>
                {resultado.actividad === 'Juego de memoria'
                  ? `Encontraste ${resultado.correctas} de ${resultado.total} parejas.`
                  : `Respondiste correctamente ${resultado.correctas} de ${resultado.total} preguntas.`}
              </p>

              <p>
                {resultado.puntos === 100
                  ? '🌟 ¡Excelente trabajo!'
                  : resultado.puntos >= 60
                    ? '👏 ¡Muy bien! Sigue practicando.'
                    : '💪 ¡No te rindas! Puedes intentarlo otra vez.'}
              </p>

              {resultado.guardado ? (
                <p
                  role="status"
                  style={{
                    color: '#2e7d32',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  ✅ ¡Tu puntuación se guardó correctamente!
                </p>
              ) : (
                <div>
                  <p
                    role="alert"
                    className="mensaje-error"
                  >
                    ⚠️ No se pudo guardar tu puntuación.
                  </p>

                  <p className="mensaje-error">
                    {resultado.errorGuardado}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={volverActividades}
              >
                🎮 Elegir otra actividad
              </button>

              <button
                type="button"
                onClick={obtenerProgreso}
              >
                🏆 Ver mi progreso
              </button>

              <button
                type="button"
                className="boton-volver"
                onClick={volverInicio}
              >
                🏠 Volver al inicio
              </button>
            </div>
          ) : actividadSeleccionada ? (
            /* JUEGOS */
            <div>
              {guardandoResultado && (
                <p role="status">
                  ⏳ Guardando tu puntuación...
                </p>
              )}

              <Juegos
                key={actividadSeleccionada.id}
                actividad={actividadSeleccionada}
                finalizar={finalizarJuego}
                volver={volverActividades}
              />
            </div>
          ) : (
            /* LISTA DE ACTIVIDADES */
            <>
              <h3>
                🎮 ¡Elige una actividad para aprender!
              </h3>

              {cargandoActividades && (
                <p>Cargando actividades... ⏳</p>
              )}

              {errorActividades && (
                <div>
                  <p role="alert" className="mensaje-error">
                    {errorActividades}
                  </p>

                  <button
                    type="button"
                    onClick={obtenerActividades}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!cargandoActividades &&
                !errorActividades && (
                  <>
                    {actividadesFiltradas.length > 0 ? (
                      <div className="lista-actividades">
                        {actividadesFiltradas.map(actividad => (
                          <div
                            className="actividad-card"
                            key={actividad.id}
                          >
                            <div className="actividad-icono">
                              {iconos[actividad.nombre] || '🎯'}
                            </div>

                            <h3>{actividad.nombre}</h3>

                            <p>{actividad.descripcion}</p>

                            <button
                              type="button"
                              onClick={() => {
                                setResultado(null);
                                setActividadSeleccionada(actividad);
                              }}
                            >
                              ¡Jugar ahora! 🚀
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>
                        Todavía no hay actividades
                        disponibles para tu nivel.
                      </p>
                    )}
                  </>
                )}

              <button
                type="button"
                onClick={obtenerProgreso}
              >
                🏆 Mi progreso
              </button>

              <button
                type="button"
                className="boton-volver"
                onClick={volverInicio}
              >
                🏠 Volver al inicio
              </button>
            </>
          )}
        </section>
      )}

      <footer>
        AprendeJugando © 2026
      </footer>
    </main>
  );
}

export default App;
