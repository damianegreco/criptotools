const router = require('express').Router();
const { middleware } = require('./middleware');
const { directorio_destino } = require('../conf/backup.json');

router.use(middleware());

router.get('/', function(req, res, next){
  res.send("OKKK")
})

module.exports = router;