const path = require('path');
const fs = require("fs");
const { execSync } = require('child_process');
const { checkFile, getFechaHoy, obtenerComandoDump, obtenerDatosConf } = require('./funciones');
const { comprimir, encriptar } = require('./encriptar');
const { enviarMail } = require('./mail');

let backupJSON = obtenerDatosConf('backup.conf.json');
let mailJSON = obtenerDatosConf('mail.conf.json');

function contarArchivos(ruta) {
  try {
    const stat = fs.statSync(ruta);
    if (stat.isFile()) return 1;
    let total = 0;
    for (const entry of fs.readdirSync(ruta)) {
      total += contarArchivos(path.join(ruta, entry));
    }
    return total;
  } catch {
    return 0;
  }
}

function copiarRecursivoConProgreso(src, dest, contador, onProgress) {
  const stat = fs.statSync(src);
  if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    contador.n++;
    if (onProgress) onProgress(contador.n);
  } else if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copiarRecursivoConProgreso(path.join(src, entry), path.join(dest, entry), contador, onProgress);
    }
  }
}

const dumpear = async function(dumpDir, envConfig, dbs, progreso = null) {
  const nombre = getFechaHoy();
  const dumpDirComp = path.join(dumpDir, nombre.toString());
  fs.mkdirSync(dumpDirComp, {recursive: true});

  for (const db of dbs) {
    const ruta = path.join(dumpDirComp, `${db}.sql`);
    const command = obtenerComandoDump(envConfig, db, ruta);
    const t = progreso ? progreso.itemInicio(db) : null;
    execSync(command, { timeout: 5 * 60 * 1000 });
    if (progreso && t) progreso.itemFin(t);
  }

  return { carpeta: dumpDirComp, nombre: nombre.toString() };
}

const agregarArchivos = async function({ archivos, carpeta }, progreso = null) {
  const validos = archivos.filter(a => a.ruta && a.nombre && fs.existsSync(a.ruta));
  if (validos.length === 0) return;

  const conTotales = validos.map(a => ({ ...a, totalArchivos: contarArchivos(a.ruta) }));
  const totalGlobal = conTotales.reduce((sum, a) => sum + a.totalArchivos, 0);

  if (progreso) progreso.iniciarCopiadoArchivos(conTotales.length, totalGlobal);

  for (let i = 0; i < conTotales.length; i++) {
    const archivo = conTotales[i];
    const nuevaRuta = path.join(carpeta, archivo.nombre);

    if (progreso) progreso.iniciarDirectorioCopia(i + 1, conTotales.length, archivo.nombre, archivo.totalArchivos);

    const contador = { n: 0 };
    const onProgress = progreso ? (n) => progreso.actualizarBarraArchivos(n) : null;
    copiarRecursivoConProgreso(archivo.ruta, nuevaRuta, contador, onProgress);

    if (progreso) progreso.finalizarBarra();
  }
}

const guardarEncriptado = async function(nombre, backupDir, dumpDir) {
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, {recursive: true});
  const archivo = path.join(dumpDir, nombre);
  const archivoBackup = path.join(backupDir, nombre);
  fs.cpSync(archivo, archivoBackup);
}

const limpiar = function(dumpDir, nombre = "1") {
  return new Promise((resolve, reject) => {
    try {
      const carpeta = path.join(dumpDir, nombre);
      const comprimido = path.join(dumpDir, `${nombre}.zip`);
      const encriptados = fs.readdirSync(dumpDir).filter((arch) => arch.includes(".enc") && arch !== `${nombre}.zip.enc`);
      for (const enc of encriptados) {
        fs.unlinkSync(path.join(dumpDir, enc));
      }
      fs.rmSync(carpeta, {recursive: true, force: true});
      if (fs.existsSync(comprimido)) fs.unlinkSync(comprimido);
      resolve();
    } catch (error) {
      reject(error);
    }
  })
}

const ordenarBackups = async function(backupDir) {
  const hoy = new Date();
  const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
  const hace365 = new Date(hoy); hace365.setDate(hoy.getDate() - 365);

  const backups = fs.readdirSync(backupDir)
    .filter(f => f.endsWith('.enc'))
    .map(nombre => {
      const partes = nombre.split('.')[0].split('-').map(Number);
      const date = new Date(partes[0], partes[1] - 1, partes[2]);
      return { nombre, date };
    });

  for (const b of backups) {
    const viejo30 = b.date < hace30;
    const viejo365 = b.date < hace365;
    const primeroDeMes = b.date.getDate() === 1;
    // Conservar: últimos 30 días + primero de mes del último año
    // Eliminar: más de 30 días Y (más de 365 días O no es el primero del mes)
    if (viejo30 && (viejo365 || !primeroDeMes)) {
      fs.unlinkSync(path.join(backupDir, b.nombre));
    }
  }
}

const realizarDump = async function(dumpDir, publicKeyFile, envConfig, progreso = null) {
  if (!checkFile(publicKeyFile)) throw 'RUTA_CLAVE_PRIVADA';

  let nombre = null;
  const cronometro = Date.now();

  try {
    // [1/6] Dumps
    if (progreso) progreso.etapa(1, 'Generando dumps de bases de datos');
    const result = await dumpear(dumpDir, envConfig, backupJSON.dbs, progreso);
    nombre = result.nombre;

    // [2/6] Archivos adicionales
    if (progreso) progreso.etapa(2, 'Copiando archivos adicionales');
    if (backupJSON.archivos && backupJSON.archivos.length > 0) {
      await agregarArchivos({ archivos: backupJSON.archivos, carpeta: result.carpeta }, progreso);
    } else if (progreso) {
      progreso.mensajeSimpleFin(progreso.mensajeSimple('sin archivos adicionales configurados'));
    }

    // [3/6] Comprimir
    if (progreso) {
      progreso.etapa(3, 'Comprimiendo');
      progreso.iniciarBarraArchiver();
    }
    const comprimido = await comprimir(
      dumpDir,
      result.carpeta,
      nombre,
      progreso ? (data) => progreso.actualizarBarraArchiver(data) : null
    );
    if (progreso) progreso.finalizarBarra();

    // [4/6] Encriptar
    const zipSize = fs.statSync(path.join(dumpDir, comprimido)).size;
    if (progreso) {
      progreso.etapa(4, 'Encriptando');
      progreso.iniciarBarraBytes(zipSize);
    }
    const nombreArchivoEnc = await encriptar(
      path.join(dumpDir, comprimido),
      publicKeyFile,
      dumpDir,
      progreso ? (procesado) => progreso.actualizarBarraBytes(procesado) : null
    );
    if (progreso) progreso.finalizarBarra();

    // [5/6] Guardar backup
    if (progreso) {
      const t = progreso.mensajeSimple('[5/6] Guardando en directorio de backup');
      await guardarEncriptado(nombreArchivoEnc, envConfig.DUMP_DIR, dumpDir);
      progreso.mensajeSimpleFin(t);
    } else {
      await guardarEncriptado(nombreArchivoEnc, envConfig.DUMP_DIR, dumpDir);
    }

    // [6/6] Ordenar
    if (progreso) {
      const t = progreso.mensajeSimple('[6/6] Ordenando backups (política de retención)');
      await ordenarBackups(envConfig.DUMP_DIR);
      progreso.mensajeSimpleFin(t);
    } else {
      await ordenarBackups(envConfig.DUMP_DIR);
    }

    if (mailJSON.enviar) {
      enviarMail(backupJSON.dbs, backupJSON.archivos, nombreArchivoEnc).catch(console.error);
    }

    const totalMs = Date.now() - cronometro;

    if (progreso) {
      const stat = fs.statSync(path.join(envConfig.DUMP_DIR, nombreArchivoEnc));
      progreso.resumen(nombreArchivoEnc, totalMs, stat.size);
    }

    return { nombreArchivoEnc, cronometro: totalMs };

  } finally {
    if (nombre) await limpiar(dumpDir, nombre).catch(console.error);
  }
}

module.exports = { realizarDump }
