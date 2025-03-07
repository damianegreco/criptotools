const fsProm = require('fs/promises');
const fs = require('fs');
const path = require('path');

/* Define la extension de los archivos que va a listar */
const EXTENSION = ".enc"

/* Obtiene listado de elementos */
function getElementos(directorio_destino){
  return new Promise((resolve, reject) => {
    fsProm.readdir(directorio_destino, { withFileTypes: true })
    .then((backups) => {
      backups = backups.filter((file) => !file.isDirectory())       //Filtra que no haya directorios dentro
      .filter((file) => file.name.includes(EXTENSION))              //Filtra que contenga la extension buscada
      .map((file) => {                                              //Agrega datos de peso y fecha de creacion
        const pathFile = path.join(directorio_destino, file.name);
        const stats = fs.statSync(pathFile);
        const data = {
          size: stats.size,
          ctime: stats.ctime.getTime()
        }
        return { name: file.name, data}; 
      })
      .sort((fileA, fileB) => {                                     //Ordena alfabeticamente
        if (fileA.name > fileB.name) return -1;
        if (fileA.name < fileB.name) return 1;
        return 0;
      });
      resolve(backups);
    })
    .catch((error) => reject(error));
  })
}

/* Obtiene el nombre del ultimo elemento ordenado alfabeticamente */
function obtenerNombreUltimo(directorio_destino){
  return new Promise((resolve, reject) => {
    fsProm.readdir(directorio_destino, { withFileTypes: true })
    .then((backups) => {
      backups = backups.filter((file) => !file.isDirectory())       //Filtra que no haya directorios dentro
      .filter((file) => file.name.includes(EXTENSION))              //Filtra que contenga la extension buscada
      .sort((fileA, fileB) => {                                     //Ordena alfabeticamente
        if (fileA.name > fileB.name) return -1;
        if (fileA.name < fileB.name) return 1;
        return 0;
      });
      /* Si hay al menos un elemnto, el primero del listado, que sera el ultimo alfabeticamente */
      if (backups.length > 0) return resolve(backups[0].name);
      /* Si no hay ningun elemento, error por no poder descargar ninguno */
      return reject("Sin backups");
    })
    .catch((error) => reject(error));
  })
}

/* Descarga el backup, en caso de no indicar nombre busca el ultimo */
function obtenerBackup (directorio_destino, nombre = null){
  return new Promise(async (resolve, reject) => {
    try {
      /* Comprueba que llegue un nombre, si no, lo establece buscando el ultimo elemento */
      if (!nombre) nombre = await obtenerNombreUltimo(directorio_destino);
    } catch (error) {
      reject(error)
    }
    
    /* Establece la ruta absoluta al archivo buscado */
    const pathFile = path.join(directorio_destino, nombre)
    fsProm.readFile(pathFile)
    .then((backup) => resolve(backup))
    .catch((error) => {
      /* Si el error es el indicado, significa que ningun elemento coincide */
      if (error.code === "ENOENT") return reject("Backup no existe");
      reject(error)
    });
  })
}

module.exports = { getElementos, obtenerBackup }