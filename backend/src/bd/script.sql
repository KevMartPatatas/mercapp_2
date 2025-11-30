-- 1. Creación de la Base de Datos
CREATE DATABASE IF NOT EXISTS mercapp_bd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mercapp_bd;

-- 2. Tabla de Usuarios (Actores del sistema)
-- Centraliza el acceso para clientes, dueños de comercios y administradores
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol ENUM('admin', 'comerciante', 'cliente') DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Tabla de Planes de Suscripción (Fuente de Ingresos 2)
-- Define los niveles: Gratuito, Premium, Empresarial, etc.
CREATE TABLE planes_suscripcion (
    id_plan INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- Ej: "Plan Básico", "Plan Tuxtla Pro"
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tasa_comision DECIMAL(5, 2) NOT NULL, -- Porcentaje que cobra Mercapp por venta (Ej: 5.00)
    beneficios_json JSON, -- Configuración de características (ej: {"analitica": true, "destacado": true})
    activo BOOLEAN DEFAULT TRUE
);

-- 4. Tabla de Comercios (Perfil de Negocio)
CREATE TABLE comercios (
    id_comercio INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL, -- Relación con el dueño (tabla usuarios)
    id_plan_actual INT DEFAULT 1, -- Relación con el plan suscrito
    nombre_negocio VARCHAR(100) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255), -- Ubicación local
    url_logo VARCHAR(255),
    url_banner VARCHAR(255),
    verificado BOOLEAN DEFAULT FALSE, -- "Check azul" para confianza
    fecha_vencimiento_plan TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_plan_actual) REFERENCES planes_suscripcion(id_plan)
);

-- 5. Categorías de Productos
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    id_padre INT NULL, -- Para subcategorías (Ej: Comida -> Tacos)
    url_imagen VARCHAR(255),
    FOREIGN KEY (id_padre) REFERENCES categorias(id_categoria)
);

-- 6. Productos y Servicios
CREATE TABLE productos (
    id_producto INT AUTO_INCREMENT PRIMARY KEY,
    id_comercio INT NOT NULL,
    id_categoria INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    cantidad_stock INT DEFAULT 0,
    url_imagen VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE, -- Para activar/pausar productos
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_comercio) REFERENCES comercios(id_comercio),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- 7. Pedidos / Órdenes (Fuente de Ingresos 1: Comisiones)
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_comercio INT NOT NULL,
    monto_total DECIMAL(10, 2) NOT NULL,
    monto_comision DECIMAL(10, 2) NOT NULL, -- Se calcula y guarda fijo aquí para reportes financieros
    estado ENUM('pendiente', 'pagado', 'procesando', 'enviado', 'entregado', 'cancelado') DEFAULT 'pendiente',
    metodo_pago VARCHAR(50), -- Ej: 'Tarjeta', 'Efectivo', 'Transferencia'
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_comercio) REFERENCES comercios(id_comercio)
);

-- 8. Detalles del Pedido (Items comprados)
CREATE TABLE detalles_pedido (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_producto INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL, -- Precio histórico al momento de la compra
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

-- 9. Sistema de Puntos / Fidelización (Relación con Clientes)
CREATE TABLE puntos_fidelidad (
    id_fidelidad INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_comercio INT NULL, -- NULL = Puntos globales de Mercapp, ID = Puntos específicos de un local
    saldo_puntos INT DEFAULT 0,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_comercio) REFERENCES comercios(id_comercio)
);

-- 10. Reseñas y Calificaciones (Confianza y Validación Social)
CREATE TABLE valoraciones (
    id_valoracion INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT,
    id_comercio INT, -- Se puede calificar el producto o el servicio del comercio en general
    id_usuario INT NOT NULL,
    puntuacion INT CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    FOREIGN KEY (id_comercio) REFERENCES comercios(id_comercio),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- 11. Campañas de Publicidad (Fuente de Ingresos Adicional)
CREATE TABLE campanas_publicidad (
    id_campana INT AUTO_INCREMENT PRIMARY KEY,
    id_comercio INT NOT NULL,
    titulo VARCHAR(100),
    url_imagen VARCHAR(255),
    id_categoria_objetivo INT, -- Segmentación: dónde aparecerá el anuncio
    fecha_inicio DATETIME,
    fecha_fin DATETIME,
    clics_contador INT DEFAULT 0, -- Métrica para reportes al comercio
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_comercio) REFERENCES comercios(id_comercio),
    FOREIGN KEY (id_categoria_objetivo) REFERENCES categorias(id_categoria)
);

-- 12. Historial de Búsquedas (Insumo clave para IA y Analítica)
CREATE TABLE historial_busquedas (
    id_busqueda INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NULL, -- Puede ser NULL si el usuario no se ha logueado
    termino_busqueda VARCHAR(255),
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- DATOS DE PRUEBA (SEED DATA)
-- =============================================

INSERT INTO planes_suscripcion (nombre, precio, tasa_comision, beneficios_json) VALUES 
('Gratuito', 0.00, 10.00, '{"analitica": false, "anuncios_gratis": 0}'),
('Premium Tuxtla', 499.00, 5.00, '{"analitica": true, "anuncios_gratis": 5}');

INSERT INTO categorias (nombre) VALUES ('Restaurantes'), ('Tecnología'), ('Ropa y Moda');