const express = require('express');
const router = express.Router();
const conection = require('../bd/db');
const bcrypt = require('bcryptjs');


//  (GET todos)
// router.get('/', async (req, res) => {
//   const sql = 'SELECT * FROM usuarios';
//   conection.query(sql, (err, results) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).json({ error: 'Error al obtener los usuarios' });
//     }
//     res.json(results);
//   });
// });

router.get('/', async (req, res) => {
  try {
    const [rows] = await conection.query(
      'SELECT * FROM usuarios'
    );

    // Enviar los datos al frontend
    res.json(rows);

  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ mensaje: "Error al obtener usuarios" });
  }
});


// (POST) Registrar nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { nombre, correo, contrasena, telefono, rol } = req.body;
    console.error(contrasena)

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, correo, contrasena)' });
    }

    const [existing] = await conection.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    const [result] = await conection.query(
      'INSERT INTO usuarios (nombre_completo, correo, contrasena, telefono, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, hash, telefono || null, rol || 'cliente']
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      correo,
      telefono: telefono || null,
      rol: rol || 'cliente'
    });

  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});


// READ (GET uno)
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM usuarios WHERE id_usuario= ?';
  conection.query(sql, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener el usuario' });
    }
    res.json(results[0]);
  });
});

// UPDATE (PUT)
router.put('/:id', (req, res) => {
  const { id } = req.params;

  const { nombre_completo, correo, telefono, rol } = req.body; 

  const sql = 'UPDATE usuarios SET nombre_completo = ?, correo= ?, telefono= ?, rol= ? WHERE id_usuario = ?';
  
  conection.query(sql, [nombre_completo, correo, telefono, rol, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al actualizar el usuario' });
    }
    res.json({ message: 'Usuario actualizado correctamente' });
  });
});

// DELETE
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM usuarios WHERE id_usuario = ?';
  conection.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar el usuario' });
    }
    console.log(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  });
});

module.exports = router;
