const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const {api_port} = require('../package.json');
const endpointsRouter = require('./endpoints');

const app = express();

/* Librerias de seguridad */
const corsConfig = {origin: '*'}

app.use(cors(corsConfig));
app.use(helmet());

app.get('/', function(req, res, next){
  res.send("OK");
})

app.use('/api', endpointsRouter);

app.use(function(req, res, next) {
  res.status(404).send("No encontrado");
})

app.listen(api_port, () => console.log(`Escuchando en puerto ${api_port}`));
