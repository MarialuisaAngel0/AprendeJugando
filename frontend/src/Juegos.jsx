
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

function JuegoMemoria({ finalizar }) {
  const [cartas, setCartas] = useState(() =>
    [...parejasMemoria, ...parejasMemoria]
      .map((emoji, i) => ({ id: i, emoji, encontrada: false }))
      .sort(() => Math.random() - 0.5)
  );
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    if (seleccionadas.length !== 2) return;

    const [a, b] = seleccionadas;

    if (cartas[a].emoji === cartas[b].emoji) {
      setCartas(actual =>
        actual.map((c, i) =>
          i === a || i === b ? { ...c, encontrada: true } : c
        )
      );
      setSeleccionadas([]);
    } else {
      const temporizador = setTimeout(() => setSeleccionadas([]), 850);
      return () => clearTimeout(temporizador);
    }
  }, [seleccionadas, cartas]);

  const encontradas = cartas.filter(c => c.encontrada).length / 2;

  function elegir(i) {
    if (seleccionadas.length === 2 ||
        seleccionadas.includes(i) ||
        cartas[i].encontrada) return;

    setSeleccionadas(actual => [...actual, i]);

    if (seleccionadas.length === 1) {
      setIntentos(actual => actual + 1);
    }
  }

  return (
    <div className="juego-contenido">
      <h2>🧠 Juego de memoria</h2>
      <p>Encuentra las seis parejas de animales y figuras.</p>
      <p>Parejas: {encontradas}/6 · Intentos: {intentos}</p>

      <div className="tablero-memoria">
        {cartas.map((carta, i) => (
          <button
            key={carta.id}
            type="button"
            className="carta-memoria"
            onClick={() => elegir(i)}
            disabled={carta.encontrada || seleccionadas.includes(i)}
            aria-label={`Carta ${i + 1}`}
          >
            {carta.encontrada || seleccionadas.includes(i)
              ? carta.emoji
              : '❓'}
          </button>
        ))}
      </div>

      {encontradas === 6 && (
        <div className="resultado-juego">
          <h2>🎉 ¡Encontraste todas las parejas!</h2>
          <p>Completaste el juego en {intentos} intentos.</p>
          <button onClick={() => finalizar(100, 6, 6)}>
            Ver resultado
          </button>
        </div>
      )}
    </div>
  );
}

export default function Juegos({ actividad, finalizar, volver }) {
  const [indice, setIndice] = useState(0);
  const [puntos, setPuntos] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [terminado, setTerminado] = useState(false);

  const esMemoria = actividad.nombre === 'Juego de memoria';
  const lista = preguntas[actividad.nombre] || [];
  const pregunta = lista[indice];

  function responder(opcion) {
    if (respuesta !== null) return;

    setRespuesta(opcion);

    if (opcion === pregunta.correcta) {
      setPuntos(actual => actual + 20);
    }
  }

  function siguiente() {
    if (indice + 1 >= lista.length) {
      setTerminado(true);
    } else {
      setIndice(actual => actual + 1);
      setRespuesta(null);
    }
  }

  if (esMemoria) {
    return (
      <div>
        <JuegoMemoria finalizar={finalizar} />
        <button className="boton-volver" onClick={volver}>
          ← Volver a las actividades
        </button>
      </div>
    );
  }

  if (!lista.length) {
    return (
      <div>
        <p>Esta actividad todavía no tiene preguntas.</p>
        <button onClick={volver}>Volver</button>
      </div>
    );
  }

  if (terminado) {
    return (
      <div className="resultado-juego">
        <h2>🏆 ¡Actividad completada!</h2>
        <h1>{puntos}/100 puntos</h1>
        <p>Respuestas correctas: {puntos / 20} de {lista.length}</p>
        <button onClick={() => finalizar(puntos, puntos / 20, lista.length)}>
          Ver resultado
        </button>
      </div>
    );
  }

  return (
    <div className="juego-contenido">
      <h2>🎮 {actividad.nombre}</h2>
      <p>Pregunta {indice + 1} de {lista.length}</p>
      <h3>{pregunta.pregunta}</h3>

      <div className="opciones-juego">
        {pregunta.opciones.map(opcion => (
          <button
            key={opcion}
            type="button"
            disabled={respuesta !== null}
            onClick={() => responder(opcion)}
            className={
              respuesta !== null && opcion === pregunta.correcta
                ? 'opcion-correcta'
                : respuesta === opcion
                  ? 'opcion-incorrecta'
                  : ''
            }
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
          <button onClick={siguiente}>
            {indice + 1 === lista.length
              ? 'Finalizar actividad 🏆'
              : 'Siguiente pregunta →'}
          </button>
        </div>
      )}

      <button className="boton-volver" onClick={volver}>
        ← Volver a las actividades
      </button>
    </div>
  );
}
