const path = require('path');
const logger = require('morgan');
const rfs = require('rotating-file-stream');

const devLogger = logger('dev');

const logPath = path.join(__dirname, '..', 'logs')

// Crea archivos rotatorios de logeo para errores, cada archivo tiene 7 dias
const errorLogStream = rfs.createStream('error.log', {
  interval: '7d', path: logPath
})

// Crea archivos rotatorios de logeo para acceso, cada archivo tiene 7 dias
const accessLogStream = rfs.createStream('access.log', {
  interval: '7d', path: logPath
})

// Establece el log para errores
const errorLogger = logger('combined', {
  skip: function (req, res) { return res.statusCode < 400 },
  stream: errorLogStream
})

// Establece el log para todos los accesos
const accessLogger = logger('combined', { 
  skip: function (req, res) { return res.statusCode >= 400 },
  stream: accessLogStream 
})

const myLogger = (req, res, next) => {
  devLogger(req, res, (error) => (error) && console.error(error));
  errorLogger(req, res, (error) => (error) && console.error(error));
  accessLogger(req, res, (error) => (error) && console.error(error));
  next();
}

module.exports = { myLogger }