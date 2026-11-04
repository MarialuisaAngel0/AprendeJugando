
import { useEffect, useState } from 'react';
import Juegos from './Juegos';
import './App.css';

const API_URL = 'http://localhost:3001/api';

const ICONOS = {
  'Ubicación espacial': '🧩',
  'Figuras geométricas': '🔷',
  'Juego de memoria': '🧠',
  'Tablas de multiplicar': '✖️',
  'Suma de fracciones': '🍰',
  'Multiplicación decimal': '🔢',
};

const NIVELES = {
  primario: 'Primario',
  preprimario: 'Preprimario',
};

function formatearFecha(fecha) {
  if (!fecha) return 'Fecha no disponible';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return 'Fecha no disponible';
  }

  return valor.toLocaleString('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function mensajeError(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Ocurrió un error inesperado.';
}

async function leerRespuesta(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
      `Error del servidor (HTTP ${respuesta.status})`
    );
  }

  return datos;
}

async function solicitarJSON(ruta, opciones) {
  const respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  return leerRespuesta(respuesta);
}

function encabezadosDocente(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function esSesionVencida(respuesta) {
  return respuesta.status === 401 || respuesta.status === 403;
}

function validarHistorial(datos, mensaje) {
  if (!datos || !Array.isArray(datos.historial)) {
    throw new TypeError(mensaje);
  }

  return datos;
}

function obtenerMensajeResultado(puntos) {
  if (puntos === 100) {
    return '🌟 ¡Excelente trabajo!';
  }

  if (puntos >= 60) {
    return '👏 ¡Muy bien! Sigue practicando.';
  }

  return '💪 ¡No te rindas! Inténtalo otra vez.';
}

function Estadisticas({ datos }) {
  const total = Number(datos.total_juegos ?? 0);
  const promedio = Number(datos.promedio ?? 0);
  const mejor = Number(datos.mejor_puntuacion ?? 0);

  return (
    <div className="resumen-progreso">
      <div className="actividad-card">
        <div className="actividad-icono">🎮</div>
        <h3>Juegos completados</h3>
        <h2>{total}</h2>
      </div>

      <div className="actividad-card">
        <div className="actividad-icono">⭐</div>
        <h3>Promedio</h3>
        <h2>{promedio.toFixed(2)}%</h2>
      </div>

      <div className="actividad-card">
        <div className="actividad-icono">🏅</div>
        <h3>Mejor puntuación</h3>
        <h2>{mejor}%</h2>
      </div>
    </div>
  );
}

function Historial({ historial = [] }) {
  if (historial.length === 0) {
    return <p>📚 Todavía no hay resultados registrados.</p>;
  }

  return (
    <div className="historial-progreso">
      {historial.map((item, indice) => (
        <div
          className="actividad-card"
          key={item.id ?? indice}
        >
          <div className="actividad-icono">
            {ICONOS[item.actividad] || '🎯'}
          </div>

          <h3>{item.actividad || 'Actividad'}</h3>
          <h2>{item.puntuacion}/100</h2>
          <p>📝 Preguntas: {item.total_preguntas}</p>
          <p>📅 {formatearFecha(item.fecha)}</p>
        </div>
      ))}
    </div>
  );
}

function ordenarEstudiantes(a, b, orden) {
  if (orden === 'promedio') {
    return Number(b.promedio ?? 0) -
      Number(a.promedio ?? 0);
  }

  if (orden === 'juegos') {
    return Number(b.total_juegos ?? 0) -
      Number(a.total_juegos ?? 0);
  }

  return String(a.nombre ?? '').localeCompare(
    String(b.nombre ?? ''),
    'es'
  );
}

function TablaEstudiantesDocente({
  estudiantes,
  onSeleccionar,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('todos');
  const [orden, setOrden] = useState('nombre');

  const estudiantesFiltrados = estudiantes
    .filter((item) => {
      const coincideNombre = String(item.nombre ?? '')
        .toLowerCase()
        .includes(busqueda.trim().toLowerCase());

      const coincideNivel =
        filtroNivel === 'todos' ||
        item.nivel === filtroNivel;

      return coincideNombre && coincideNivel;
    })
    .sort((a, b) => ordenarEstudiantes(a, b, orden));

  return (
    <section className="tabla-docente-contenedor">
      <div className="tabla-docente-encabezado">
        <h3>📚 Lista de estudiantes</h3>
        <p>
          Busca, filtra y consulta el progreso
          académico de cada estudiante.
        </p>
      </div>

      <div className="filtros-docente">
        <div className="campo-filtro">
          <label htmlFor="buscar-estudiante">
            🔎 Buscar estudiante
          </label>

          <input
            id="buscar-estudiante"
            type="search"
            placeholder="Escribe un nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="campo-filtro">
          <label htmlFor="filtrar-nivel">
            🎓 Nivel educativo
          </label>

          <select
            id="filtrar-nivel"
            value={filtroNivel}
            onChange={(e) => setFiltroNivel(e.target.value)}
          >
            <option value="todos">
              Todos los niveles
            </option>
            <option value="preprimario">
              Preprimario
            </option>
            <option value="primario">
              Primario
            </option>
          </select>
        </div>

        <div className="campo-filtro">
          <label htmlFor="ordenar-estudiantes">
            ↕️ Ordenar por
          </label>

          <select
            id="ordenar-estudiantes"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          >
            <option value="nombre">Nombre</option>
            <option value="promedio">Mayor promedio</option>
            <option value="juegos">
              Más juegos completados
            </option>
          </select>
        </div>
      </div>

      <p className="contador-estudiantes">
        👥 Mostrando {estudiantesFiltrados.length} de{' '}
        {estudiantes.length} estudiantes
      </p>

      <div className="tabla-docente-scroll">
        <table className="tabla-estudiantes">
          <thead>
            <tr>
              <th scope="col">Estudiante</th>
              <th scope="col">Edad</th>
              <th scope="col">Nivel</th>
              <th scope="col">Juegos</th>
              <th scope="col">Promedio</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>

          <tbody>
            {estudiantesFiltrados.map((item) => (
              <tr key={item.id}>
                <td className="nombre-estudiante">
                  <span className="avatar-estudiante">
                    🧒
                  </span>
                  {item.nombre}
                </td>

                <td>{item.edad} años</td>

                <td>
                  <span
                    className={`etiqueta-nivel ${item.nivel}`}
                  >
                    {NIVELES[item.nivel] ?? item.nivel}
                  </span>
                </td>

                <td>{Number(item.total_juegos ?? 0)}</td>

                <td>
                  <strong>
                    {Number(item.promedio ?? 0).toFixed(2)}%
                  </strong>
                </td>

                <td>
                  <button
                    type="button"
                    className="boton-ver-reporte"
                    onClick={() =>
                      onSeleccionar(String(item.id))
                    }
                  >
                    📋 Ver reporte
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {estudiantesFiltrados.length === 0 && (
        <p className="sin-estudiantes">
          🔍 No se encontraron estudiantes.
        </p>
      )}
    </section>
  );
}

function RegistroEstudiante({
  nombre,
  setNombre,
  edad,
  setEdad,
  nivel,
  setNivel,
  cargando,
  error,
  comenzar,
  abrirPanelDocente,
}) {
  return (
    <section className="tarjeta">
      <h2>¡Hola, pequeño explorador! 👋</h2>
      <p>Cuéntanos un poquito sobre ti.</p>

      <form onSubmit={comenzar}>
        <label htmlFor="nombre">Tu nombre</label>

        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
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
          onChange={(e) => setEdad(e.target.value)}
          placeholder="¿Cuántos años tienes?"
          required
        />

        <label htmlFor="nivel">
          Tu nivel educativo
        </label>

        <select
          id="nivel"
          value={nivel}
          onChange={(e) => setNivel(e.target.value)}
          required
        >
          <option value="">Selecciona tu nivel</option>
          <option value="preprimario">Preprimario</option>
          <option value="primario">Primario</option>
        </select>

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={cargando}>
          {cargando
            ? '⏳ Registrando...'
            : '¡Comenzar aventura! 🚀'}
        </button>
      </form>

      <div className="acceso-docente">
        <button
          type="button"
          className="boton-volver"
          onClick={abrirPanelDocente}
        >
          👩‍🏫 Acceso docente
        </button>
      </div>
    </section>
  );
}

function LoginDocente({
  usuarioDocente,
  setUsuarioDocente,
  passwordDocente,
  setPasswordDocente,
  iniciandoSesion,
  errorLogin,
  iniciarSesionDocente,
}) {
  return (
    <div className="login-docente">
      <p>
        🔐 Ingresa tus credenciales para consultar
        el progreso de los estudiantes.
      </p>

      <form
        onSubmit={iniciarSesionDocente}
        style={{
          maxWidth: '420px',
          margin: '25px auto',
          textAlign: 'left',
        }}
      >
        <label htmlFor="usuario-docente">
          Usuario
        </label>

        <input
          id="usuario-docente"
          type="text"
          value={usuarioDocente}
          onChange={(e) =>
            setUsuarioDocente(e.target.value)
          }
          autoComplete="username"
          required
        />

        <label htmlFor="password-docente">
          Contraseña
        </label>

        <input
          id="password-docente"
          type="password"
          value={passwordDocente}
          onChange={(e) =>
            setPasswordDocente(e.target.value)
          }
          placeholder="Escribe tu contraseña"
          autoComplete="current-password"
          required
        />

        {errorLogin && (
          <p className="mensaje-error" role="alert">
            {errorLogin}
          </p>
        )}

        <button
          type="submit"
          disabled={iniciandoSesion}
        >
          {iniciandoSesion
            ? '⏳ Iniciando sesión...'
            : '🔓 Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}

function ReporteDocente({
  estudiante,
  reporte,
}) {
  return (
    <div className="reporte-docente">
      <h2>📋 Reporte de {estudiante.nombre}</h2>

      <p>Edad: {estudiante.edad} años</p>

      <p>
        Nivel: {NIVELES[estudiante.nivel] ?? estudiante.nivel}
      </p>

      <Estadisticas datos={reporte} />

      <h3>📚 Historial de actividades</h3>

      <Historial historial={reporte.historial} />
    </div>
  );
}

function ContenidoDocente({
  estudiantesDocente,
  estudianteDocenteId,
  reporteDocente,
  cargandoDocente,
  cargandoReporte,
  errorDocente,
  consultarReporte,
  reintentarDocente,
  cerrarSesionDocente,
}) {
  const estudianteSeleccionado = estudiantesDocente.find(
    (item) => String(item.id) === estudianteDocenteId
  );

  return (
    <>
      <p>
        Consulta el progreso académico de los
        estudiantes registrados.
      </p>

      <p
        style={{
          color: '#2e7d32',
          fontWeight: 'bold',
        }}
      >
        ✅ Sesión docente iniciada
      </p>

      {cargandoDocente && (
        <output>⏳ Cargando estudiantes...</output>
      )}

      {!cargandoDocente &&
        estudiantesDocente.length > 0 && (
          <TablaEstudiantesDocente
            estudiantes={estudiantesDocente}
            onSeleccionar={consultarReporte}
          />
        )}

      {!cargandoDocente &&
        estudiantesDocente.length > 0 && (
          <div className="selector-docente">
            <label htmlFor="estudiante-docente">
              👩‍🎓 Seleccionar estudiante
            </label>

            <select
              id="estudiante-docente"
              value={estudianteDocenteId}
              disabled={cargandoReporte}
              onChange={(e) => {
                void consultarReporte(e.target.value);
              }}
            >
              <option value="">
                Selecciona un estudiante
              </option>

              {estudiantesDocente.map((item) => (
                <option
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.nombre} — ID {item.id} — {item.nivel}
                </option>
              ))}
            </select>
          </div>
        )}

      {errorDocente && (
        <p className="mensaje-error" role="alert">
          {errorDocente}
        </p>
      )}

      {errorDocente && (
        <button
          type="button"
          onClick={reintentarDocente}
        >
          🔄 Reintentar
        </button>
      )}

      {!cargandoDocente &&
        !errorDocente &&
        estudiantesDocente.length === 0 && (
          <p>No hay estudiantes registrados.</p>
        )}

      {!cargandoDocente &&
        estudiantesDocente.length > 0 && (
          <p>
            👥 Estudiantes registrados:{' '}
            <strong>{estudiantesDocente.length}</strong>
          </p>
        )}

      {cargandoReporte && (
        <output>⏳ Cargando reporte...</output>
      )}

      {estudianteSeleccionado &&
        reporteDocente &&
        !cargandoReporte && (
          <ReporteDocente
            estudiante={estudianteSeleccionado}
            reporte={reporteDocente}
          />
        )}

      <button
        type="button"
        className="boton-volver"
        onClick={cerrarSesionDocente}
      >
        🔒 Cerrar sesión docente
      </button>
    </>
  );
}

function PanelDocente({
  tokenDocente,
  login,
  contenido,
  volver,
}) {
  let cuerpo;

  if (tokenDocente) {
    cuerpo = <ContenidoDocente {...contenido} />;
  } else {
    cuerpo = <LoginDocente {...login} />;
  }

  return (
    <section className="tarjeta tarjeta-actividades">
      <div className="actividad-icono">👩‍🏫</div>
      <h2>Panel del docente</h2>

      {cuerpo}

      <button
        type="button"
        className="boton-volver"
        onClick={volver}
      >
        ← Volver
      </button>
    </section>
  );
}

function PantallaProgreso({
  estudiante,
  progreso,
  cargandoProgreso,
  errorProgreso,
  obtenerProgreso,
  volverActividades,
  volverInicio,
}) {
  return (
    <div className="pantalla-progreso">
      <div className="actividad-icono">🏆</div>

      <h2>Mi progreso</h2>

      <p>
        ¡Descubre cuánto has aprendido,{' '}
        {estudiante.nombre}!
      </p>

      {cargandoProgreso && (
        <output>⏳ Cargando tu progreso...</output>
      )}

      {errorProgreso && (
        <div>
          <p className="mensaje-error" role="alert">
            {errorProgreso}
          </p>

          <button
            type="button"
            onClick={() => {
              void obtenerProgreso();
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {!cargandoProgreso &&
        !errorProgreso &&
        progreso && (
          <>
            <Estadisticas datos={progreso} />
            <h3>📚 Historial de actividades</h3>
            <Historial historial={progreso.historial} />
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
  );
}

function ResultadoJuego({
  resultado,
  volverActividades,
  obtenerProgreso,
  volverInicio,
}) {
  const esMemoria =
    resultado.actividad === 'Juego de memoria';

  const descripcion = esMemoria
    ? `Encontraste ${resultado.correctas} de ${resultado.total} parejas.`
    : `Respondiste correctamente ${resultado.correctas} de ${resultado.total} preguntas.`;

  return (
    <div className="resultado-juego">
      <div className="actividad-icono">🏆</div>

      <h2>¡Actividad completada!</h2>
      <h3>{resultado.actividad}</h3>
      <h1>{resultado.puntos}/100</h1>

      <p>{descripcion}</p>
      <p>{obtenerMensajeResultado(resultado.puntos)}</p>

      {resultado.guardado && (
        <output
          style={{
            color: '#2e7d32',
            fontWeight: 'bold',
          }}
        >
          ✅ ¡Tu puntuación se guardó correctamente!
        </output>
      )}

      {!resultado.guardado && (
        <div>
          <p className="mensaje-error" role="alert">
            ⚠️ No se pudo guardar tu puntuación.
          </p>

          {resultado.errorGuardado && (
            <p className="mensaje-error">
              {resultado.errorGuardado}
            </p>
          )}
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
        onClick={() => {
          void obtenerProgreso();
        }}
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
  );
}

function ListaActividades({
  actividades,
  cargandoActividades,
  errorActividades,
  obtenerActividades,
  seleccionarActividad,
  obtenerProgreso,
  abrirPanelDocente,
  volverInicio,
}) {
  return (
    <>
      <h3>🎮 ¡Elige una actividad para aprender!</h3>

      {cargandoActividades && (
        <output>⏳ Cargando actividades...</output>
      )}

      {errorActividades && (
        <div>
          <p className="mensaje-error" role="alert">
            {errorActividades}
          </p>

          <button
            type="button"
            onClick={() => {
              void obtenerActividades();
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {!cargandoActividades &&
        !errorActividades &&
        actividades.length > 0 && (
          <div className="lista-actividades">
            {actividades.map((actividad) => (
              <div
                className="actividad-card"
                key={actividad.id}
              >
                <div className="actividad-icono">
                  {ICONOS[actividad.nombre] || '🎯'}
                </div>

                <h3>{actividad.nombre}</h3>
                <p>{actividad.descripcion}</p>

                <button
                  type="button"
                  onClick={() =>
                    seleccionarActividad(actividad)
                  }
                >
                  ¡Jugar ahora! 🚀
                </button>
              </div>
            ))}
          </div>
        )}

      {!cargandoActividades &&
        !errorActividades &&
        actividades.length === 0 && (
          <p>
            Todavía no hay actividades disponibles
            para tu nivel.
          </p>
        )}

      <button
        type="button"
        onClick={() => {
          void obtenerProgreso();
        }}
      >
        🏆 Mi progreso
      </button>

      <button
        type="button"
        className="boton-volver"
        onClick={abrirPanelDocente}
      >
        👩‍🏫 Acceso docente
      </button>

      <button
        type="button"
        className="boton-volver"
        onClick={volverInicio}
      >
        🏠 Volver al inicio
      </button>
    </>
  );
}

function AreaEstudiante({
  estudiante,
  pantalla,
  progresoProps,
  resultadoProps,
  juegoProps,
  actividadesProps,
}) {
  let contenido;

  if (pantalla === 'progreso') {
    contenido = <PantallaProgreso {...progresoProps} />;
  } else if (resultadoProps.resultado) {
    contenido = <ResultadoJuego {...resultadoProps} />;
  } else if (juegoProps.actividadSeleccionada) {
    contenido = (
      <div>
        {juegoProps.guardandoResultado && (
          <output>⏳ Guardando tu puntuación...</output>
        )}

        <Juegos
          key={juegoProps.actividadSeleccionada.id}
          actividad={juegoProps.actividadSeleccionada}
          finalizar={juegoProps.finalizarJuego}
          volver={juegoProps.volverActividades}
        />
      </div>
    );
  } else {
    contenido = <ListaActividades {...actividadesProps} />;
  }

  return (
    <section className="tarjeta tarjeta-actividades">
      <h2>¡Bienvenido, {estudiante.nombre}! 🎉</h2>
      <p>Edad: {estudiante.edad} años</p>

      <p>
        Nivel: {NIVELES[estudiante.nivel] ?? estudiante.nivel}
      </p>

      {contenido}
    </section>
  );
}

function validarRegistro(nombre, edad, nivel) {
  const edadNumero = Number(edad);

  if (!nombre.trim() || !edad || !nivel) {
    return 'Completa todos los campos';
  }

  const nombreInvalido = nombre.trim().length > 100;
  const edadInvalida =
    !Number.isInteger(edadNumero) ||
    edadNumero < 3 ||
    edadNumero > 15;

  if (nombreInvalido || edadInvalida) {
    return 'Verifica tu nombre y edad (3 a 15 años)';
  }

  if (!['preprimario', 'primario'].includes(nivel)) {
    return 'Selecciona un nivel válido';
  }

  return '';
}

function crearResultado(
  actividad,
  puntos,
  correctas,
  total
) {
  const puntuacion = Number(puntos);
  const respuestasCorrectas = Number(correctas);
  const totalPreguntas = Number(total);

  const datosInvalidos =
    !Number.isFinite(puntuacion) ||
    !Number.isInteger(totalPreguntas) ||
    totalPreguntas <= 0 ||
    !Number.isInteger(respuestasCorrectas) ||
    respuestasCorrectas < 0 ||
    respuestasCorrectas > totalPreguntas;

  if (datosInvalidos) {
    throw new TypeError('Resultado del juego inválido');
  }

  return {
    actividad: actividad.nombre,
    puntos: Math.max(
      0,
      Math.min(100, Math.round(puntuacion))
    ),
    correctas: respuestasCorrectas,
    total: totalPreguntas,
    guardado: false,
    errorGuardado: '',
  };
}

function useAprendeJugando() {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [nivel, setNivel] = useState('');

  const [estudiante, setEstudiante] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [
    actividadSeleccionada,
    setActividadSeleccionada,
  ] = useState(null);

  const [resultado, setResultado] = useState(null);
  const [pantalla, setPantalla] = useState('actividades');
  const [progreso, setProgreso] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [
    cargandoActividades,
    setCargandoActividades,
  ] = useState(false);
  const [
    cargandoProgreso,
    setCargandoProgreso,
  ] = useState(false);
  const [
    guardandoResultado,
    setGuardandoResultado,
  ] = useState(false);

  const [error, setError] = useState('');
  const [
    errorActividades,
    setErrorActividades,
  ] = useState('');
  const [errorProgreso, setErrorProgreso] = useState('');

  const [
    usuarioDocente,
    setUsuarioDocente,
  ] = useState('docente');
  const [
    passwordDocente,
    setPasswordDocente,
  ] = useState('');
  const [tokenDocente, setTokenDocente] = useState(null);
  const [
    iniciandoSesion,
    setIniciandoSesion,
  ] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');

  const [
    estudiantesDocente,
    setEstudiantesDocente,
  ] = useState([]);
  const [
    estudianteDocenteId,
    setEstudianteDocenteId,
  ] = useState('');
  const [
    reporteDocente,
    setReporteDocente,
  ] = useState(null);

  const [
    cargandoDocente,
    setCargandoDocente,
  ] = useState(false);
  const [
    cargandoReporte,
    setCargandoReporte,
  ] = useState(false);
  const [errorDocente, setErrorDocente] = useState('');

  async function obtenerActividades() {
    setCargandoActividades(true);
    setErrorActividades('');

    try {
      const datos = await solicitarJSON('/actividades');

      if (!Array.isArray(datos)) {
        throw new TypeError(
          'Formato de actividades incorrecto'
        );
      }

      setActividades(datos);
    } catch (err) {
      console.error(err);
      setErrorActividades(mensajeError(err));
    } finally {
      setCargandoActividades(false);
    }
  }

  useEffect(() => {
    if (estudiante?.id) {
      void obtenerActividades();
    }
  }, [estudiante?.id]);

  async function comenzar(evento) {
    evento.preventDefault();
    setError('');

    const errorValidacion = validarRegistro(
      nombre,
      edad,
      nivel
    );

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setCargando(true);

    try {
      const datos = await solicitarJSON('/estudiantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          edad: Number(edad),
          nivel,
        }),
      });

      if (!datos.estudiante?.id) {
        throw new TypeError(
          'No se recibió un estudiante válido'
        );
      }

      setEstudiante(datos.estudiante);
      setActividadSeleccionada(null);
      setResultado(null);
      setProgreso(null);
      setPantalla('actividades');
    } catch (err) {
      console.error(err);
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  }

  async function finalizarJuego(puntos, correctas, total) {
    if (guardandoResultado) return;

    if (!actividadSeleccionada || !estudiante?.id) {
      setErrorActividades(
        'No se identificó la actividad o estudiante'
      );
      return;
    }

    let nuevoResultado;

    try {
      nuevoResultado = crearResultado(
        actividadSeleccionada,
        puntos,
        correctas,
        total
      );
    } catch (err) {
      console.error(err);
      return;
    }

    setGuardandoResultado(true);

    try {
      await solicitarJSON('/resultados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estudiante_id: estudiante.id,
          actividad_id: actividadSeleccionada.id,
          puntuacion: nuevoResultado.puntos,
          total_preguntas: nuevoResultado.total,
        }),
      });

      nuevoResultado.guardado = true;
      setProgreso(null);
    } catch (err) {
      console.error(err);
      nuevoResultado.errorGuardado = mensajeError(err);
    } finally {
      setResultado({ ...nuevoResultado });
      setActividadSeleccionada(null);
      setGuardandoResultado(false);
    }
  }

  async function obtenerProgreso() {
    if (!estudiante?.id) return;

    setPantalla('progreso');
    setCargandoProgreso(true);
    setErrorProgreso('');
    setProgreso(null);

    try {
      const datos = await solicitarJSON(
        `/resultados/estudiante/${estudiante.id}`
      );

      setProgreso(
        validarHistorial(
          datos,
          'Formato de progreso incorrecto'
        )
      );
    } catch (err) {
      console.error(err);
      setErrorProgreso(mensajeError(err));
    } finally {
      setCargandoProgreso(false);
    }
  }

  function manejarSesionVencida() {
    setTokenDocente(null);
    setPasswordDocente('');
    setEstudiantesDocente([]);
    setEstudianteDocenteId('');
    setReporteDocente(null);
    setErrorLogin(
      'Tu sesión venció. Inicia sesión nuevamente.'
    );
  }

  async function cargarEstudiantesDocente(token) {
    if (!token) return;

    setCargandoDocente(true);
    setErrorDocente('');
    setReporteDocente(null);
    setEstudianteDocenteId('');

    try {
      const respuesta = await fetch(
        `${API_URL}/estudiantes`,
        {
          headers: encabezadosDocente(token),
        }
      );

      if (esSesionVencida(respuesta)) {
        manejarSesionVencida();
        return;
      }

      const datos = await leerRespuesta(respuesta);

      if (!Array.isArray(datos)) {
        throw new TypeError(
          'Formato de estudiantes incorrecto'
        );
      }

      setEstudiantesDocente(datos);
    } catch (err) {
      console.error(err);
      setErrorDocente(mensajeError(err));
    } finally {
      setCargandoDocente(false);
    }
  }

  async function consultarReporte(id) {
    setEstudianteDocenteId(id);
    setReporteDocente(null);
    setErrorDocente('');

    if (!id || !tokenDocente) return;

    setCargandoReporte(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/docente/resultados/estudiante/${encodeURIComponent(id)}`,
        {
          method: 'GET',
          headers: encabezadosDocente(tokenDocente),
        }
      );

      if (esSesionVencida(respuesta)) {
        manejarSesionVencida();
        return;
      }

      const datos = await leerRespuesta(respuesta);

      setReporteDocente(
        validarHistorial(
          datos,
          'Formato de reporte incorrecto'
        )
      );
    } catch (err) {
      console.error(err);
      setErrorDocente(mensajeError(err));
    } finally {
      setCargandoReporte(false);
    }
  }

  async function iniciarSesionDocente(evento) {
    evento.preventDefault();

    if (iniciandoSesion) return;

    setErrorLogin('');
    setIniciandoSesion(true);

    try {
      const datos = await solicitarJSON(
        '/docente/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usuario: usuarioDocente.trim(),
            password: passwordDocente,
          }),
        }
      );

      if (typeof datos.token !== 'string' ||
          !datos.token) {
        throw new TypeError(
          'El servidor no devolvió un token válido'
        );
      }

      setTokenDocente(datos.token);
      setPasswordDocente('');

      await cargarEstudiantesDocente(datos.token);
    } catch (err) {
      console.error(err);
      setErrorLogin(mensajeError(err));
    } finally {
      setIniciandoSesion(false);
    }
  }

  function abrirPanelDocente() {
    if (guardandoResultado) return;

    setPantalla('docente');
    setActividadSeleccionada(null);
    setResultado(null);
    setErrorDocente('');
    setErrorLogin('');

    if (tokenDocente) {
      void cargarEstudiantesDocente(tokenDocente);
    }
  }

  function cerrarSesionDocente() {
    setTokenDocente(null);
    setPasswordDocente('');
    setErrorLogin('');
    setErrorDocente('');
    setEstudiantesDocente([]);
    setEstudianteDocenteId('');
    setReporteDocente(null);
    setPantalla('actividades');
  }

  function reintentarDocente() {
    if (estudianteDocenteId) {
      void consultarReporte(estudianteDocenteId);
      return;
    }

    if (tokenDocente) {
      void cargarEstudiantesDocente(tokenDocente);
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

    setTokenDocente(null);
    setPasswordDocente('');
    setErrorLogin('');
    setErrorDocente('');
    setEstudiantesDocente([]);
    setEstudianteDocenteId('');
    setReporteDocente(null);
  }

  function seleccionarActividad(actividad) {
    setResultado(null);
    setActividadSeleccionada(actividad);
  }

  const actividadesFiltradas = actividades.filter(
    (actividad) => actividad.nivel === estudiante?.nivel
  );

  return {
    estudiante,
    pantalla,
    tokenDocente,

    registro: {
      nombre,
      setNombre,
      edad,
      setEdad,
      nivel,
      setNivel,
      cargando,
      error,
      comenzar,
      abrirPanelDocente,
    },

    login: {
      usuarioDocente,
      setUsuarioDocente,
      passwordDocente,
      setPasswordDocente,
      iniciandoSesion,
      errorLogin,
      iniciarSesionDocente,
    },

    docente: {
      estudiantesDocente,
      estudianteDocenteId,
      reporteDocente,
      cargandoDocente,
      cargandoReporte,
      errorDocente,
      consultarReporte,
      reintentarDocente,
      cerrarSesionDocente,
    },

    progresoProps: {
      estudiante,
      progreso,
      cargandoProgreso,
      errorProgreso,
      obtenerProgreso,
      volverActividades,
      volverInicio,
    },

    resultadoProps: {
      resultado,
      volverActividades,
      obtenerProgreso,
      volverInicio,
    },

    juegoProps: {
      actividadSeleccionada,
      guardandoResultado,
      finalizarJuego,
      volverActividades,
    },

    actividadesProps: {
      actividades: actividadesFiltradas,
      cargandoActividades,
      errorActividades,
      obtenerActividades,
      seleccionarActividad,
      obtenerProgreso,
      abrirPanelDocente,
      volverInicio,
    },

    volverPanelDocente: estudiante
      ? volverActividades
      : volverInicio,
  };
}

function App() {
  const app = useAprendeJugando();

  let contenido;

  if (app.pantalla === 'docente') {
    contenido = (
      <PanelDocente
        tokenDocente={app.tokenDocente}
        login={app.login}
        contenido={app.docente}
        volver={app.volverPanelDocente}
      />
    );
  } else if (!app.estudiante) {
    contenido = (
      <RegistroEstudiante {...app.registro} />
    );
  } else {
    contenido = (
      <AreaEstudiante
        estudiante={app.estudiante}
        pantalla={app.pantalla}
        progresoProps={app.progresoProps}
        resultadoProps={app.resultadoProps}
        juegoProps={app.juegoProps}
        actividadesProps={app.actividadesProps}
      />
    );
  }

  return (
    <main className="contenedor">
      <header>
        <div className="logo">🌈</div>
        <h1>AprendeJugando</h1>
        <p>¡Una aventura llena de aprendizaje!</p>
      </header>

      {contenido}

      <footer>AprendeJugando © 2026</footer>
    </main>
  );
}

export default App;
