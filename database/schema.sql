
CREATE DATABASE IF NOT EXISTS aprendejugando
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE aprendejugando;

CREATE TABLE IF NOT EXISTS estudiantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  edad INT NOT NULL,
  nivel ENUM('preprimario', 'primario') NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  nivel ENUM('preprimario', 'primario') NOT NULL,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS resultados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  actividad_id INT NOT NULL,
  puntuacion INT NOT NULL DEFAULT 0,
  total_preguntas INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (estudiante_id)
    REFERENCES estudiantes(id),
  FOREIGN KEY (actividad_id)
    REFERENCES actividades(id)
);

INSERT INTO actividades (nombre, nivel, descripcion)
SELECT datos.nombre, datos.nivel, datos.descripcion
FROM (
  SELECT 'Ubicación espacial' AS nombre,
         'preprimario' AS nivel,
         'Arriba, abajo, adentro y afuera' AS descripcion
  UNION ALL SELECT 'Figuras geométricas',
         'preprimario', 'Reconocer figuras'
  UNION ALL SELECT 'Juego de memoria',
         'preprimario', 'Encontrar parejas'
  UNION ALL SELECT 'Tablas de multiplicar',
         'primario', 'Practicar multiplicaciones'
  UNION ALL SELECT 'Suma de fracciones',
         'primario', 'Resolver sumas de fracciones'
  UNION ALL SELECT 'Multiplicación decimal',
         'primario', 'Multiplicar números decimales'
) AS datos
WHERE NOT EXISTS (
  SELECT 1 FROM actividades a
  WHERE a.nombre = datos.nombre
    AND a.nivel = datos.nivel
);
