// bd/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'alee',
  database: 'mercapp_bd',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Comprobación opcional al iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Conectado a la base de datos, threadId:', conn.threadId);
    conn.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
  }
})();

module.exports = pool;
