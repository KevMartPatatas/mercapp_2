const express = require('express');
const router = express.Router();
const conection = require('../bd/db');
const bcrypt = require('bcryptjs');

// POST: Crear Pedido (Checkout)
router.post('/', async (req, res) => {
    // Recibimos el ID del cliente y la lista de productos del carrito
    const { id_cliente, productos } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío' });
    }

    try {
        // 1. AGRUPAR PRODUCTOS POR COMERCIO
        // (Porque si compras a 2 tiendas, son 2 pedidos distintos)
        const pedidosPorComercio = {};

        productos.forEach(prod => {
            const idComercio = prod.id_comercio;
            if (!pedidosPorComercio[idComercio]) {
                pedidosPorComercio[idComercio] = [];
            }
            pedidosPorComercio[idComercio].push(prod);
        });

        const ordenesGeneradas = [];

        // 2. PROCESAR CADA GRUPO COMO UN PEDIDO INDEPENDIENTE
        for (const idComercio in pedidosPorComercio) {
            const items = pedidosPorComercio[idComercio];
            
            // Calcular total de este pedido específico
            const totalPedido = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            const comision = totalPedido * 0.10; // Ejemplo: 10% de comisión para Mercapp

            // A) INSERTAR EN TABLA 'PEDIDOS'
            const sqlPedido = `INSERT INTO pedidos (id_cliente, id_comercio, monto_total, monto_comision, estado, metodo_pago) VALUES (?, ?, ?, ?, 'pendiente', 'Efectivo')`;
            const [resultPedido] = await conection.query(sqlPedido, [id_cliente, idComercio, totalPedido, comision]);
            
            const idPedidoGenerado = resultPedido.insertId;
            ordenesGeneradas.push(idPedidoGenerado);

            // B) INSERTAR EN TABLA 'DETALLES_PEDIDO' (Los items)
            for (const item of items) {
                const sqlDetalle = `INSERT INTO detalles_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)`;
                await conection.query(sqlDetalle, [idPedidoGenerado, item.id_producto, item.cantidad, item.precio]);
            }
        }

        res.json({ 
            message: 'Compra realizada con éxito', 
            ordenes_creadas: ordenesGeneradas 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al procesar el pedido' });
    }
});

module.exports = router;