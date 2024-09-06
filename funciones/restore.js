const { checkArgs } = require('./funciones');
const { desencriptar } = require('./desencriptar');

const desencriptarArchivo = function(privateKeyDir, dumpDir, encriptadoDir, encriptadoFilename){
  return new Promise(async (resolve, reject) => {
    try {
      //Debe indicarse donde está la clave privada y la fecha del archivo a restaurar
      if (checkArgs([privateKeyDir, encriptadoFilename])){
        let cronometro = new Date();

        await desencriptar(privateKeyDir, dumpDir, encriptadoDir, encriptadoFilename)

        cronometro = (new Date() - cronometro)
        resolve({cronometro});
      } else {
        reject("argumentos");
      }
    } catch (error) {
      reject(error);
    }
  })
}

module.exports = { desencriptarArchivo };