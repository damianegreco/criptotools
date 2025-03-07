const router = require('express').Router();
const { middleware } = require('./middleware');

const { directorio_destino } = require('../conf/backup.conf.json');
const {getElementos, obtenerBackup} = require('./funciones');

/* Controla que todos los recursos deben benir con JWT firmado por una clave reconocida */
router.use(middleware());

/* Lista los elementos de la carpeta definida para los backups, que coincidan con la extension buscada */
router.get('/', function(req, res, next){
  getElementos(directorio_destino)
  .then((backups) => {
    res.json({backups})
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send(error);
  })
})

/* Descarga el ultimo, ordenado alfabeticamente por el nombre, de la carpeta */
router.get('/ultimo', function(req, res, next){
  obtenerBackup(directorio_destino)
  .then((backup) => res.sendFile(backup))
  .catch((error) => {
    console.error(error);
    res.status(500).send(error);
  })
})

/* Descarga el elemento por el nombre solicitado */
router.get('/:nombre', function(req, res, next){
  const {nombre} = req.params;
  obtenerBackup(directorio_destino, nombre)
  .then((backup) => res.sendFile(backup))
  .catch((error) => {
    console.error(error);
    res.status(500).send(error);
  })
})

module.exports = router;