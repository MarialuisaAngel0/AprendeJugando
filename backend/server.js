
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());


/* =====================================
   AUTENTICACIÓN DEL DOCENTE
   ===================================== */

const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    mensaje: 'Demasiados intentos. Intenta nuevamente en 15 minutos.'
  }
});

app.post('/api/docente/login', limitarLogin, async (req, res) => {
  try {
    const { usuario, password } = req.body || {};

    if (
      typeof usuario !== 'string' ||
      typeof password !== 'string' ||
      password.length > 200
    ) {
      return res.status(400).json({
        mensaje: 'Credenciales inválidas'
      });
    }

    const usuarioValido =
      usuario === process.env.DOCENTE_USUARIO;

    const hash = process.env.DOCENTE_PASSWORD_HASH;

    if (
      !process.env.JWT_SECRET ||
      !hash ||
      !process.env.DOCENTE_USUARIO
    ) {
      console.error('Falta configuración de autenticación');

      return res.status(503).json({
        mensaje: 'Inicio de sesión no disponible'
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      hash
    );

    if (!usuarioValido || !passwordValida) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        rol: 'docente'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
        algorithm: 'HS256'
      }
    );

    return res.json({
      mensaje: 'Sesión iniciada correctamente',
      token,
      expires_in: 7200
    });

  } catch (error) {
    console.error('Error de autenticación:', error.message);

    return res.status(500).json({
      mensaje: 'Error al iniciar sesión'
    });
  }
});

function verificarDocente(req, res, next) {
  const autorizacion = req.headers.authorization || '';

  if (!autorizacion.startsWith('Bearer ')) {
    return res.status(401).json({
      mensaje: 'Se requiere iniciar sesión como docente'
    });
  }

  const token = autorizacion.slice(7);

  try {
    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256']
      }
    );

    if (datos.rol !== 'docente') {
      return res.status(403).json({
        mensaje: 'Acceso no autorizado'
      });
    }

    next();

  } catch {
    return res.status(401).json({
      mensaje: 'Sesión inválida o vencida'
    });
  }
}


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


/* =========================================
   PANEL DOCENTE - LISTAR ESTUDIANTES
   ========================================= */

app.get('/api/estudiantes', verificarDocente, async (req, res) => {
  try {
    const [estudiantes] = await db.query(`
      SELECT
        e.id,
        e.nombre,
        e.edad,
        e.nivel,
        e.fecha_registro,
        COUNT(r.id) AS total_juegos,
        ROUND(AVG(r.puntuacion), 2) AS promedio,
        MAX(r.puntuacion) AS mejor_puntuacion
      FROM estudiantes e
      LEFT JOIN resultados r
        ON r.estudiante_id = e.id
      GROUP BY
        e.id,
        e.nombre,
        e.edad,
        e.nivel,
        e.fecha_registro
      ORDER BY e.nombre ASC, e.id ASC
    `);

    res.json(
      estudiantes.map(estudiante => ({
        ...estudiante,
        total_juegos: Number(estudiante.total_juegos),
        promedio: Number(estudiante.promedio ?? 0),
        mejor_puntuacion: Number(
          estudiante.mejor_puntuacion ?? 0
        )
      }))
    );

  } catch (error) {
    console.error(
      'Error al consultar estudiantes:',
      error.message
    );

    res.status(500).json({
      mensaje: 'Error al consultar estudiantes'
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


/* =========================================
   PANEL DOCENTE - REPORTE DE ESTUDIANTE
   Ruta protegida mediante JWT
   ========================================= */

app.get(
  '/api/docente/resultados/estudiante/:id',
  verificarDocente,
  async (req, res) => {
    try {
      const estudianteId = Number(req.params.id);

      if (
        !Number.isSafeInteger(estudianteId) ||
        estudianteId <= 0
      ) {
        return res.status(400).json({
          mensaje: 'ID de estudiante inválido'
        });
      }

      // Verificar que el estudiante exista
      const [estudiantes] = await db.execute(
        `SELECT id, nombre, edad, nivel
         FROM estudiantes
         WHERE id = ?`,
        [estudianteId]
      );

      if (estudiantes.length === 0) {
        return res.status(404).json({
          mensaje: 'Estudiante no encontrado'
        });
      }

      // Obtener historial de actividades
      const [resultados] = await db.execute(
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
            (suma, resultado) =>
              suma + Number(resultado.puntuacion),
            0
          ) / totalJuegos
        : 0;

      const mejorPuntuacion = totalJuegos
        ? Math.max(
            ...resultados.map(
              resultado => Number(resultado.puntuacion)
            )
          )
        : 0;

      return res.json({
        estudiante_id: estudianteId,
        total_juegos: totalJuegos,
        promedio: Number(promedio.toFixed(2)),
        mejor_puntuacion: mejorPuntuacion,
        historial: resultados
      });

    } catch (error) {
      console.error(
        'Error al consultar reporte docente:',
        error.message
      );

      return res.status(500).json({
        mensaje: 'Error al consultar el reporte docente'
      });
    }
  }
);



// Iniciar servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
