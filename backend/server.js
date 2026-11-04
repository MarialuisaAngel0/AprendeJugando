
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

// Verificar conexión a MySQL
app.get('/api/salud', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      estado: 'correcto',
      mensaje: 'AprendeJugando conectado a MySQL'
    });
  } catch (error) {
    console.error('Error de conexión:', error.message);

    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudo conectar a MySQL'
    });
  }
});

// Obtener actividades educativas
app.get('/api/actividades', async (req, res) => {
  try {
    const [actividades] = await db.query(
      'SELECT id, nombre, nivel, descripcion FROM actividades ORDER BY id'
    );

    res.json(actividades);
  } catch (error) {
    console.error('Error:', error.message);

    res.status(500).json({
      mensaje: 'Error al consultar actividades'
    });
  }
});



// Registrar un estudiante en MySQL
app.post('/api/estudiantes', async (req, res) => {
  try {
    const { nombre, edad, nivel } = req.body;

    // Validar datos recibidos
    if (
      typeof nombre !== 'string' ||
      nombre.trim().length === 0 ||
      nombre.trim().length > 100 ||
      !Number.isInteger(edad) ||
      edad < 3 ||
      edad > 18 ||
      !['preprimario', 'primario'].includes(nivel)
    ) {
      return res.status(400).json({
        mensaje: 'Datos del estudiante no válidos'
      });
    }

    // Guardar estudiante con consulta parametrizada
    const [resultado] = await db.execute(
      'INSERT INTO estudiantes (nombre, edad, nivel) VALUES (?, ?, ?)',
      [nombre.trim(), edad, nivel]
    );

    res.status(201).json({
      mensaje: 'Estudiante registrado correctamente',
      estudiante: {
        id: resultado.insertId,
        nombre: nombre.trim(),
        edad,
        nivel
      }
    });

  } catch (error) {
    console.error('Error al registrar estudiante:', error.message);

    res.status(500).json({
      mensaje: 'Error al registrar estudiante'
    });
  }
});


 // Registrar resultado de una actividad
app.post('/api/resultados', async (req, res) => {
  try {
    const {
      estudiante_id,
      actividad_id,
      puntuacion,
      total_preguntas
    } = req.body;

    if (
      !Number.isInteger(estudiante_id) ||
      !Number.isInteger(actividad_id) ||
      !Number.isInteger(puntuacion) ||
      !Number.isInteger(total_preguntas) ||
      estudiante_id <= 0 ||
      actividad_id <= 0 ||
      puntuacion < 0 ||
      puntuacion > 100 ||
      total_preguntas <= 0
    ) {
      return res.status(400).json({
        mensaje: 'Los datos del resultado no son válidos'
      });
    }

    const [resultado] = await db.query(
      `INSERT INTO resultados
       (estudiante_id, actividad_id, puntuacion, total_preguntas)
       VALUES (?, ?, ?, ?)`,
      [
        estudiante_id,
        actividad_id,
        puntuacion,
        total_preguntas
      ]
    );

    res.status(201).json({
      mensaje: 'Resultado guardado correctamente',
      resultado: {
        id: resultado.insertId,
        estudiante_id,
        actividad_id,
        puntuacion,
        total_preguntas
      }
    });

  } catch (error) {
    console.error('Error al guardar resultado:', error.message);

    res.status(500).json({
      mensaje: 'Error al guardar el resultado'
    });
  }
});


 // Obtener historial de resultados de un estudiante
app.get('/api/resultados/estudiante/:id', async (req, res) => {
  try {
    const estudianteId = Number(req.params.id);

    if (!Number.isInteger(estudianteId) || estudianteId <= 0) {
      return res.status(400).json({
        mensaje: 'ID de estudiante inválido'
      });
    }

    const [resultados] = await db.query(
      `SELECT
        r.id,
        r.estudiante_id,
        r.actividad_id,
        a.nombre AS actividad,
        r.puntuacion,
        r.total_preguntas,
        r.fecha
      FROM resultados r
      INNER JOIN actividades a
        ON r.actividad_id = a.id
      WHERE r.estudiante_id = ?
      ORDER BY r.fecha DESC, r.id DESC`,
      [estudianteId]
    );

    const totalJuegos = resultados.length;

    const promedio = totalJuegos
      ? resultados.reduce(
          (suma, r) => suma + Number(r.puntuacion),
          0
        ) / totalJuegos
      : 0;

    const mejorPuntuacion = totalJuegos
      ? Math.max(...resultados.map(r => Number(r.puntuacion)))
      : 0;

    res.json({
      estudiante_id: estudianteId,
      total_juegos: totalJuegos,
      promedio: Number(promedio.toFixed(2)),
      mejor_puntuacion: mejorPuntuacion,
      historial: resultados
    });

  } catch (error) {
    console.error('Error al consultar progreso:', error);

    res.status(500).json({
      mensaje: 'Error al consultar el progreso'
    });
  }
});


// Iniciar servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
