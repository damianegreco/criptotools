const path = require('path');
const fs = require("fs");
const { execSync } = require('child_process');
const { checkFile, getFechaHoy, obtenerComandoDump, obtenerDatosConf } = require('./funciones');
const { comprimir, encriptar } = require('./encriptar');

let backupJSON = obtenerDatosConf('backup.conf.json');
//dumpear
const dumpear = function(dumpDir, envConfig, dbs){
  return new Promise((resolve, reject) => {
    try {
      // Obtiene el nombre del archivo usando la fecha actual en formato AAAA-MM-DD
      const nombre = getFechaHoy();
      const dumpDirComp = path.join(dumpDir, nombre.toString())
  
      // Crea la carpeta nueva
      fs.mkdirSync(dumpDirComp, {recursive:true});
      console.log(dbs);
      
      // Para cada DB del JSON, genera un dump y lo guarda en la carpeta temporal de backup
      dbs.forEach((db) => {
        const ruta = path.join(dumpDirComp, `${db}.sql`);

        const command = obtenerComandoDump(envConfig, db, ruta)

        //const command = `PGPASSWORD=${envConfig.DUMP_PASS} pg_dump -U ${envConfig.DUMP_USER} -h ${envConfig.DBHOST} -p ${envConfig.DBPORT} -d ${db} --inserts > ${ruta}`
        
        execSync(command);
        console.log(`Dump realizado correctamente DB ${db}`);
      });

      // Devuelve la ruta de la carpeta y el nombre con el cual debe continuar
      resolve({carpeta: dumpDirComp, nombre: nombre.toString()});
    } catch (error) {
      reject(error);
    }
  })
}

const agregarArchivos = function({archivos, carpeta}){
  return new Promise((resolve, reject) => {
    try {
      // Para cada direcotrio de archivos del JSON, lo copia en la carpeta temporal de backup 
      for (let i = 0; i < archivos.length; i++) {
        const nuevaRuta = path.join(carpeta, archivos[i].nombre)
        fs.cpSync(archivos[i].ruta, nuevaRuta, {recursive: true});
      }
      resolve();
    } catch (error) {
      reject(error);
    }
  })
}

const guardarEncriptado = function(nombre, backupDir, dumpDir){
  return new Promise((resolve, reject) => {
    try {
      // Comprueba que exista el directorio, si no, lo crea
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, {recursive:true});
      const archivo = path.join(dumpDir, nombre);
      
      // Guarda el nuevo encriptado en el directorio de backups
      const archivoBackup = path.join(backupDir, nombre);
      console.log({archivo, archivoBackup, nombre});
      
      fs.cpSync(archivo, archivoBackup);
      resolve();
    } catch (error) {
      if (error.code === "EACCES") return reject("Permiso denegado en el directorio de backup");
      reject(error);
    }
  })
}

//elimina la carpeta con los dumps, archivos y comprimido, excepto el encriptado
const limpiar = function(dumpDir, nombre = "1"){
  return new Promise((resolve, reject) => {
    try {
      const carpeta = path.join(dumpDir, nombre)
      const comprimido = path.join(dumpDir, `${nombre}.zip`);
      const encriptados = fs.readdirSync(dumpDir).filter((arch) => arch.includes(".enc") && arch !== `${nombre}.zip.enc`);
      for (let i = 0; i < encriptados.length; i++) {
        fs.unlinkSync(path.join(dumpDir, encriptados[i]));
      }
      fs.rmSync(carpeta, {recursive:true, force:true});
      fs.unlinkSync(comprimido);
      resolve();
    } catch (error) {
      reject(error)
    }
  })
}

const ordenarBackups = function(backupDir){
  return new Promise((resolve, reject) => {
    try {
      // Obtiene todos los archivos de la carpeta de backup y convierte a fecha
      let backups = fs.readdirSync(backupDir).filter((arch) => arch.includes(".enc")).map((arch) => {
        const fecha = arch.split(".")[0].split("-").map((valor) => parseInt(valor));
        const date = new Date(fecha[0], fecha[1] - 1, fecha[2]);
        return({nombre:arch, date})
      })

      // Ultimos 30 dias OK
      const ultimoMes = new Date();
      ultimoMes.setDate(ultimoMes.getDate() - 30);
      backups = backups.filter((arch) => arch.date < ultimoMes);

      // 1ro de cada mes del ultimo año OK
      const ultimoAnio = new Date();
      ultimoAnio.setDate(ultimoAnio.getDate() - 365);
      backups = backups.filter((arch) => arch.date < ultimoAnio || arch.date.getDate() !== 1);

      // Elimina los que tienen mas de 1 mes, no son el primero de cada mes y los que tienen mas de un año
      for (let i = 0; i < backups.length; i++) {
        const ruta = path.join(backupDir, backups[i].nombre);
        fs.unlinkSync(ruta);
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

const realizarDump = async function(dumpDir, publicKeyFile, envConfig){
  return new Promise(async (resolve, reject) => {
    try {
      
      if(checkFile(publicKeyFile)){
        let cronometro = new Date();
  
        // Genera el dump de las db
        const {carpeta, nombre} = await dumpear(dumpDir, envConfig, backupJSON.dbs);
        
        // Agrega los archivos como pdf
        await agregarArchivos({archivos: backupJSON.archivos, carpeta, nombre});
        
        // Comprime la carpeta que contiene los dumps y los archivos
        const comprimido = await comprimir(dumpDir, carpeta, nombre);
        
        // Encripta el comprimido usando la clave publica
        const nombreArchivoEnc = await encriptar(path.join(dumpDir, comprimido), publicKeyFile, dumpDir);
  
        // Envia el encriptado a la carpeta de backups
        guardarEncriptado(nombreArchivoEnc, envConfig.DUMP_DIR, dumpDir)
        .then(async () => {
          // Limpia la carpeta de backups, dejando solo los archivos necesarios
          await ordenarBackups(envConfig.DUMP_DIR);
    
          cronometro = (new Date() - cronometro)
          resolve({nombreArchivoEnc, cronometro});
        })
        .catch((error) => reject(error))
        .finally(async () => await limpiar(dumpDir, nombre))
      } else {
        reject('RUTA_CLAVE_PRIVADA')
      }
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = { realizarDump }