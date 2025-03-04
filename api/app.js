const express = require('express');

/* seguridad y control*/
const helmet = require('helmet');
const cors = require('cors');
const {myLogger} = require('./logger');
const { rateLimit } = require('express-rate-limit')

const {api_port} = require('../package.json');
const endpointsRouter = require('./endpoints');

const app = express();

/* Librerias de seguridad */
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutos
	limit: 100, // Limite de 100 consultas por ventana (5 minutos)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
const corsConfig = {origin: '*'}

app.use(myLogger);
app.use(limiter)
app.use(cors(corsConfig));
app.use(helmet());

/* Ruta de inicio para control */
app.get('/', function(req, res, next){
  res.send("OK");
})

/* API completa */
app.use('/api', endpointsRouter);

/* Si no entro en api, 404 */
app.use(function(req, res, next) {
  res.status(404).send("No encontrado");
})

/* Asigna puerto del package.json, pero si no lo hay establece por defecto 3001 */
const puerto = api_port ?? 3001;
app.listen(puerto, () => console.log(`Escuchando en puerto ${puerto}`));
