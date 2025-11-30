const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./bd/db'); 
//const conecction = require('./')
const usuariosRoute = require('./routes/users')
const loginsRoute = require('./routes/login')
const categoriasRoute = require('./routes/categorias')
const productosRoute = require('./routes/productos')
const PORT = 3000;
const path = require("path");


app.use(cors());
app.use(express.json());

app.use('/usuarios', usuariosRoute);
app.use('/login', loginsRoute);
app.use('/categorias', categoriasRoute);
app.use('/productos', productosRoute);

app.use(express.static(path.join(__dirname, "../../frontend")));

app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

