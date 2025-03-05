const db = require('./db/main')();
const router = require('express').Router();
const fs = require('fs');
const { middleware } = require('./middleware');

function obtenerFilePath(hash) {
  return new Promise((resolve, reject) => {
    db.links.findAsync({hash, used:false})
    .then((rutas) => {
      if (!rutas || rutas.length === 0) return reject("No encontrado");
      return resolve(rutas[0])
    })
    .catch((error) => console.error(error))
  })
}

router.get("/listar", middleware(),function(req, res, next){
  db.links.findAsync({})
  .then((rutas) => {
    res.json({rutas})
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send(error)
  })
})

router.get('/:hash', function(req, res, next){
  const {hash} = req.params;

  obtenerFilePath(hash)
  .then(async(ruta) => {
    await db.links.updateAsync(
      { _id: ruta._id }, 
      { $set: {  used:true, usedAt: new Date() } },
      { multi:false }
    );
    if (!fs.existsSync(ruta.pathFile)) {
      console.error("Archivo no existe");
      return res.status(500).send("No existe el archivo");
    }
    res.download(ruta.pathFile, ruta.fileName)
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send(error)
  })
})

module.exports = router;
