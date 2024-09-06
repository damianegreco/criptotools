var fs = require("fs");
const path = require("path");

const checkFile = function(publicKeyFile){
  return fs.existsSync(publicKeyFile)
}

const checkArgs = function(keys = []){
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === null || keys[i] === undefined) return false;
  }
  return true;
}

const getFechaHoy = function(){
  const date = new Date();
  const nombre = {
    dia: date.getDate() < 10 ? "0" + date.getDate() : date.getDate(),
    mes: date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) : date.getMonth()+1,
    anio: date.getFullYear(),
    toString: function () {
      return `${this.anio}-${this.mes}-${this.dia}`
    }
  }
  return nombre;
}

const escribirArchivo = function(nombreArchivo, datos){
  return new Promise((resolve, reject) => {
    try {
      const archivo = path.join(__dirname, '..', 'conf', nombreArchivo);
      fs.writeFileSync(archivo, JSON.stringify(datos, null, 2), {encoding:"utf8", flag:'w'});
      resolve();
    } catch (error) {
      reject(error);
    }
  })
}

const obtenerDatosConf = function(nombreArchivo){
  try {
    const archivo = path.join(__dirname, '..', 'conf', nombreArchivo);
    const jsonArchivo = fs.readFileSync(archivo,{encoding:'utf8', flag:'r'});
    return (JSON.parse(jsonArchivo));
  } catch (error) {
    return ({});
  }
}

const obtenerComandoDump = function(datos = {motordb, host, port, user, pass}, db, destino){
//  const command = 

  const motores = {
    'mysql': `mysqldump -h ${datos.host} -P ${datos.port} -u ${datos.user} -p${datos.pass} ${db} > ${destino}`,
    'postgres': `PGPASSWORD=${datos.pass} pg_dump -U ${datos.user} -h ${datos.host} -p ${datos.port} -d ${db} --inserts > ${destino}`
  }

  return(motores[datos.motordb]);
}

module.exports = { checkFile, checkArgs, getFechaHoy, escribirArchivo, obtenerDatosConf, obtenerComandoDump }