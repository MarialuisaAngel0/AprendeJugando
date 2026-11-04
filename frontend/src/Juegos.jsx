
import { useEffect, useState } from 'react';

const preguntas = {
  'Tablas de multiplicar': [
    { pregunta: '¿Cuánto es 3 × 4?', opciones: ['7', '12', '14'], correcta: '12' },
    { pregunta: '¿Cuánto es 6 × 5?', opciones: ['30', '25', '35'], correcta: '30' },
    { pregunta: '¿Cuánto es 7 × 8?', opciones: ['54', '56', '64'], correcta: '56' },
    { pregunta: '¿Cuánto es 9 × 3?', opciones: ['27', '21', '36'], correcta: '27' },
    { pregunta: '¿Cuánto es 4 × 6?', opciones: ['20', '24', '28'], correcta: '24' }
  ],
  'Suma de fracciones': [
    { pregunta: '1/2 + 1/2 = ?', opciones: ['1', '1/2', '2'], correcta: '1' },
    { pregunta: '1/4 + 2/4 = ?', opciones: ['3/4', '2/8', '1/4'], correcta: '3/4' },
    { pregunta: '1/3 + 1/3 = ?', opciones: ['1/6', '2/3', '1'], correcta: '2/3' },
    { pregunta: '2/5 + 1/5 = ?', opciones: ['3/5', '3/10', '1/5'], correcta: '3/5' },
    { pregunta: '1/2 + 1/4 = ?', opciones: ['2/6', '3/4', '1/4'], correcta: '3/4' }
  ],
  'Multiplicación decimal': [
    { pregunta: '1.5 × 2 = ?', opciones: ['3', '2.5', '4'], correcta: '3' },
    { pregunta: '2.5 × 2 = ?', opciones: ['4', '5', '6'], correcta: '5' },
    { pregunta: '0.5 × 4 = ?', opciones: ['2', '4', '0.2'], correcta: '2' },
    { pregunta: '1.2 × 3 = ?', opciones: ['3.6', '4.2', '2.6'], correcta: '3.6' },
    { pregunta: '0.3 × 5 = ?', opciones: ['1.5', '0.8', '15'], correcta: '1.5' }
  ],
  'Ubicación espacial': [
    { pregunta: '¿Dónde está el sol durante el día?', opciones: ['Arriba', 'Abajo', 'Adentro'], correcta: 'Arriba' },
    { pregunta: '¿Dónde están los zapatos cuando los guardas en una caja?', opciones: ['Afuera', 'Adentro', 'Arriba'], correcta: 'Adentro' },
    { pregunta: '¿Qué dirección es opuesta a arriba?', opciones: ['Abajo', 'Adentro', 'Afuera'], correcta: 'Abajo' },
    { pregunta: 'Si sales de una casa, estás...', opciones: ['Adentro', 'Afuera', 'Abajo'], correcta: 'Afuera' },
    { pregunta: '¿Dónde está el techo respecto al piso?', opciones: ['Arriba', 'Abajo', 'Adentro'], correcta: 'Arriba' }
  ],
  'Figuras geométricas': [
    { pregunta: '¿Qué figura tiene tres lados?', opciones: ['Triángulo', 'Cuadrado', 'Círculo'], correcta: 'Triángulo' },
    { pregunta: '¿Qué figura es redonda?', opciones: ['Círculo', 'Triángulo', 'Rectángulo'], correcta: 'Círculo' },
    { pregunta: '¿Qué figura tiene cuatro lados iguales?', opciones: ['Cuadrado', 'Triángulo', 'Círculo'], correcta: 'Cuadrado' },
    { pregunta: '¿Qué figura se parece a una puerta?', opciones: ['Rectángulo', 'Círculo', 'Triángulo'], correcta: 'Rectángulo' },
    { pregunta: '¿Qué figura tiene cinco lados?', opciones: ['Pentágono', 'Cuadrado', 'Triángulo'], correcta: 'Pentágono' }
  ]
};

const parejasMemoria = ['🐶', '🐱', '🐸', '🦋', '🌸', '⭐'];

function mezclarCartas() {
  const cartas = [...parejasMemoria, ...parejasMemoria]
    .map((emoji, id) => ({
      id,
      emoji,
      encontrada: false
    }));

  for (let i = cartas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[j]] = [cartas[j], cartas[i]];
  }

  return cartas;
}

function obtenerClaseOpcion(opcion, respuesta, correcta) {
  if (respuesta === null) {
    return '';
  }

  if (opcion === correcta) {
    return 'opcion-correcta';
  }

  if (opcion === respuesta) {
    return 'opcion-incorrecta';
  }

  return '';
}

function JuegoMemoria({ finalizar }) {
  const [cartas, setCartas] = useState(mezclarCartas);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [intentos, setIntentos] = useState(0);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    if (seleccionadas.length !== 2) {
      return undefined;
    }

    const [a, b] = seleccionadas;

    if (cartas[a].emoji === cartas[b].emoji) {
      setCartas(actual =>
        actual.map((carta, indice) => {
          if (indice === a || indice === b) {
            return { ...carta, encontrada: true };
          }

          return carta;
        })
      );

      setSeleccionadas([]);
      return undefined;
    }

    const temporizador = setTimeout(() => {
      setSeleccionadas([]);
    }, 850);

    return () => clearTimeout(temporizador);
  }, [seleccionadas, cartas]);

  const encontradas =
    cartas.filter(carta => carta.encontrada).length / 2;

  function elegir(indice) {
    if (
      seleccionadas.length === 2 ||
      seleccionadas.includes(indice) ||
      cartas[indice].encontrada ||
      finalizando
    ) {
      return;
    }

    setSeleccionadas(actual => [...actual, indice]);

    if (seleccionadas.length === 1) {
      setIntentos(actual => actual + 1);
    }
  }

  function terminarMemoria() {
    if (finalizando) {
      return;
    }

    setFinalizando(true);
    finalizar(100, 6, 6);
  }

  return (
    <div className="juego-contenido">
      <h2>🧠 Juego de memoria</h2>

      <p>Encuentra las seis parejas de animales y figuras.</p>

      <p>
        Parejas: {encontradas}/6 · Intentos: {intentos}
      </p>

      <div className="tablero-memoria">
        {cartas.map((carta, indice) => {
          const visible =
            carta.encontrada ||
            seleccionadas.includes(indice);

          return (
            <button
              key={carta.id}
              type="button"
              className="carta-memoria"
              onClick={() => elegir(indice)}
              disabled={
                carta.encontrada ||
                seleccionadas.includes(indice) ||
                seleccionadas.length === 2 ||
                finalizando
              }
              aria-label={
                visible
                  ? `Carta ${indice + 1}: ${carta.emoji}`
                  : `Carta ${indice + 1}: oculta`
              }
            >
              {visible ? carta.emoji : '❓'}
            </button>
          );
        })}
      </div>

      {encontradas === parejasMemoria.length && (
        <div className="resultado-juego">
          <h2>🎉 ¡Encontraste todas las parejas!</h2>

          <p>
            Completaste el juego en {intentos} intentos.
          </p>

          <button
            type="button"
            onClick={terminarMemoria}
            disabled={finalizando}
          >
            {finalizando ? '⏳ Guardando...' : 'Ver resultado'}
          </button>
        </div>
      )}
    </div>
  );
}

function JuegoPreguntas({ actividad, finalizar, volver }) {
  const [indice, setIndice] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [terminado, setTerminado] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const lista = preguntas[actividad.nombre] || [];
  const pregunta = lista[indice];

  function responder(opcion) {
    if (respuesta !== null || finalizando) {
      return;
    }

    setRespuesta(opcion);

    if (opcion === pregunta.correcta) {
      setPuntos(actual => actual + 20);
    }
  }

  function siguiente() {
    if (indice + 1 >= lista.length) {
      setTerminado(true);
      return;
    }

    setIndice(actual => actual + 1);
    setRespuesta(null);
  }

  function terminarPreguntas() {
    if (finalizando) {
      return;
    }

    setFinalizando(true);

    const correctas = puntos / 20;

    finalizar(puntos, correctas, lista.length);
  }

  if (lista.length === 0) {
    return (
      <div className="juego-contenido">
        <p>Esta actividad todavía no tiene preguntas.</p>

        <button type="button" onClick={volver}>
          Volver
        </button>
      </div>
    );
  }

  if (terminado) {
    return (
      <div className="resultado-juego">
        <h2>🏆 ¡Actividad completada!</h2>

        <h1>{puntos}/100 puntos</h1>

        <p>
          Respuestas correctas: {puntos / 20} de {lista.length}
        </p>

        <button
          type="button"
          onClick={terminarPreguntas}
          disabled={finalizando}
        >
          {finalizando ? '⏳ Guardando...' : 'Ver resultado'}
        </button>
      </div>
    );
  }

  return (
    <div className="juego-contenido">
      <h2>🎮 {actividad.nombre}</h2>

      <p>
        Pregunta {indice + 1} de {lista.length}
      </p>

      <h3>{pregunta.pregunta}</h3>

      <div className="opciones-juego">
        {pregunta.opciones.map(opcion => (
          <button
            key={opcion}
            type="button"
            disabled={respuesta !== null}
            onClick={() => responder(opcion)}
            className={obtenerClaseOpcion(
              opcion,
              respuesta,
              pregunta.correcta
            )}
          >
            {opcion}
          </button>
        ))}
      </div>

      {respuesta !== null && (
        <div>
          <p>
            {respuesta === pregunta.correcta
              ? '🌟 ¡Muy bien! Respuesta correcta.'
              : `💡 La respuesta correcta es: ${pregunta.correcta}`}
          </p>

          <button type="button" onClick={siguiente}>
            {indice + 1 === lista.length
              ? 'Finalizar actividad 🏆'
              : 'Siguiente pregunta →'}
          </button>
        </div>
      )}

      <button
        type="button"
        className="boton-volver"
        onClick={volver}
      >
        ← Volver a las actividades
      </button>
    </div>
  );
}

export default function Juegos({
  actividad,
  finalizar,
  volver
}) {
  if (actividad.nombre === 'Juego de memoria') {
    return (
      <div>
        <JuegoMemoria finalizar={finalizar} />

        <button
          type="button"
          className="boton-volver"
          onClick={volver}
        >
          ← Volver a las actividades
        </button>
      </div>
    );
  }

  return (
    <JuegoPreguntas
      actividad={actividad}
      finalizar={finalizar}
      volver={volver}
    />
  );
}
