const express = require('express');
const router = express.Router();
const db = require('../bd/db'); // tu conexión MySQL
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'mercapp_secreto_super_seguro_2025';

// Función para generar token JWT
function generarToken(userId) {
  return jwt.sign({ id: userId }, SECRET_KEY, { expiresIn: '1h' });
}

router.post("/", async (req, res) => {
  const { correo, password } = req.body;

  const [resultado] = await db.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
  const usuario = resultado[0];

  if (!usuario) {
    return res.status(401).json({ mensaje: "Credenciales incorrectas" });
  }

  const passwordCorrecto = await bcrypt.compare(password, usuario.contrasena);
  if (!passwordCorrecto) {
    return res.status(401).json({ mensaje: "Credenciales incorrectas" });
  }

  const token = generarToken(usuario.id);
  res.json({ token });
});


// RUTA PROTEGIDA DE PERFIL
router.get('/perfil', (req, res) => {
    res.json({ message: "Ruta de perfil (requiere validación de token)" });
});

module.exports = router;
