const router = require('express').Router();
const { middleware } = require('./middleware');
const { obtenerDatosConf } = require('../funciones/funciones');
const { getElementos, obtenerBackup } = require('./funciones');
const fs = require('fs');

const { directorio_destino } = obtenerDatosConf('backup.conf.json');

router.use(middleware());

router.get('/', function(req, res, next){
  getElementos(directorio_destino)
  .then((backups) => {
    res.json({ backups });
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send("Error interno");
  });
});

router.get('/ultimo', function(req, res, next){
  obtenerBackup(directorio_destino)
  .then((backup) => {
    fs.createReadStream(backup).pipe(res);
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send("Error interno");
  });
});

router.get('/:nombre', function(req, res, next){
  const { nombre } = req.params;
  // Prevenir path traversal
  if (nombre.includes('..') || nombre.includes('/')) {
    return res.status(400).send("Nombre inválido");
  }
  obtenerBackup(directorio_destino, nombre)
  .then((backup) => {
    fs.createReadStream(backup).pipe(res);
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send("Error interno");
  });
});

module.exports = router;
