const express = require('express');
const router = express.Router();
const conection = require('../bd/db');
const bcrypt = require('bcryptjs');


// GET: Obtener productos
router.get('/', async (req, res) => {
    const sql = `
        SELECT 
            p.*,
            u.nombre_completo AS nombre_comercio,
            c.nombre AS nombre_categoria
        FROM productos p
        LEFT JOIN usuarios u ON p.id_comercio = u.id_usuario
        LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
        WHERE p.activo = 1
        ORDER BY p.id_producto DESC
    `;
    
    try {
        const [results] = await conection.query(sql);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// POST: Crear Producto
router.post('/', async (req, res) => {
    const { id_comercio, id_categoria, nombre, descripcion, precio, cantidad_stock, url_imagen } = req.body;

    const sql = `INSERT INTO productos (id_comercio, id_categoria, nombre, descripcion, precio, cantidad_stock, url_imagen) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    try {
        const [result] = await conection.query(sql, [id_comercio, id_categoria, nombre, descripcion, precio, cantidad_stock, url_imagen]);
        res.json({ message: 'Producto creado', id_producto: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// PUT: Actualizar Producto
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { id_comercio, id_categoria, nombre, descripcion, precio, cantidad_stock, url_imagen } = req.body;

    const sql = `
        UPDATE productos 
        SET id_comercio=?, id_categoria=?, nombre=?, descripcion=?, precio=?, cantidad_stock=?, url_imagen=? 
        WHERE id_producto=?
    `;

    try {
        await conection.query(sql, [id_comercio, id_categoria, nombre, descripcion, precio, cantidad_stock, url_imagen, id]);
        res.json({ message: 'Producto actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// DELETE: Borrado Lógico
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const sql = 'UPDATE productos SET activo = 0 WHERE id_producto = ?';
    
    try {
        await conection.query(sql, [id]);
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

module.exports = router;