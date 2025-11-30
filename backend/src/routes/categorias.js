const express = require('express');
const router = express.Router();
const conection = require('../bd/db');
const bcrypt = require('bcryptjs'); // (Opcional si no lo usas en este archivo puedes quitarlo)

// GET: Obtener categorías (Corregido a async/await)
router.get('/', async (req, res) => {
    const sql = `
        SELECT 
            c.id_categoria, 
            c.nombre, 
            c.url_imagen, 
            c.id_padre,
            p.nombre AS nombre_padre 
        FROM categorias c
        LEFT JOIN categorias p ON c.id_padre = p.id_categoria
        ORDER BY c.id_categoria DESC
    `;
    
    try {
        // Al usar promesas, la consulta devuelve un array: [filas, metadatos]
        // Por eso usamos const [results]
        const [results] = await conection.query(sql);
        
        console.log("Categorías enviadas al frontend:", results); 
        res.json(results);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener categorías' });
    }
});

// POST: Crear nueva categoría (Corregido a async/await)
router.post('/', async (req, res) => {
    const { nombre, id_padre, url_imagen } = req.body;

    // Validación básica
    if (!nombre || !id_padre) {
        return res.status(400).json({ error: 'El nombre y la categoría padre son obligatorios' });
    }

    const iconoFinal = url_imagen || 'fas fa-folder'; 
    const sql = 'INSERT INTO categorias (nombre, id_padre, url_imagen) VALUES (?, ?, ?)';

    try {
        // Ejecutamos con await
        const [result] = await conection.query(sql, [nombre, id_padre, iconoFinal]);

        // Respondemos con éxito
        res.json({ 
            message: 'Categoría creada exitosamente',
            id_categoria: result.insertId,
            nombre: nombre,
            id_padre: id_padre,
            url_imagen: iconoFinal
        });

    } catch (err) {
        console.error("Error SQL:", err);
        res.status(500).json({ error: 'Error al guardar la categoría' });
    }
});

// DELETE: Eliminar una categoría por ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Ejecutamos la eliminación
        const sql = 'DELETE FROM categorias WHERE id_categoria = ?';
        const [result] = await conection.query(sql, [id]);

        // Verificamos si realmente se borró algo
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'La categoría no existe' });
        }

        res.json({ message: 'Categoría eliminada correctamente' });

    } catch (err) {
        console.error("Error al eliminar:", err);
        // Error común: Intentar borrar una categoría que tiene productos asignados (Constraint foreign key)
        res.status(500).json({ error: 'No se pudo eliminar. Verifique que no tenga productos asignados.' });
    }
});

// PUT: Actualizar una categoría
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, id_padre, url_imagen } = req.body;

    // El icono por defecto si lo dejan vacío
    const iconoFinal = url_imagen || 'fas fa-folder';

    const sql = 'UPDATE categorias SET nombre = ?, id_padre = ?, url_imagen = ? WHERE id_categoria = ?';

    try {
        const [result] = await conection.query(sql, [nombre, id_padre, iconoFinal, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }

        res.json({ message: 'Categoría actualizada correctamente' });
    } catch (err) {
        console.error("Error al actualizar:", err);
        res.status(500).json({ error: 'Error al actualizar la categoría' });
    }
});


module.exports = router;