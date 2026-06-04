const cliProgress = require('cli-progress');

const ANCHO = 50;

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTiempo(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

class ProgresoBackup {
  constructor() {
    this._totalEtapas = 6;
    this._barraActiva = null;
    this._barraInicio = 0;
    this._barraTotal = 0;
    this._barraProcesadoAnterior = 0;
    this._barraTiempoAnterior = 0;
    this._tipoBarraActiva = null;
  }

  encabezado(fecha) {
    const titulo = `BACKUP — ${fecha}`;
    const inner = ANCHO - 2;
    const pad = Math.max(0, inner - titulo.length);
    const left = Math.floor(pad / 2);
    const right = pad - left;
    console.log('\n╔' + '═'.repeat(inner) + '╗');
    console.log('║' + ' '.repeat(left) + titulo + ' '.repeat(right) + '║');
    console.log('╚' + '═'.repeat(inner) + '╝');
  }

  etapa(numero, nombre) {
    console.log(`\n[${numero}/${this._totalEtapas}] ${nombre}`);
  }

  itemInicio(nombre) {
    process.stdout.write(`  ▶ ${nombre} ... `);
    return Date.now();
  }

  itemFin(inicio) {
    process.stdout.write(`✓ (${formatTiempo(Date.now() - inicio)})\n`);
  }

  iniciarCopiadoArchivos(totalDirs, totalArchivos) {
    const dirStr = totalDirs === 1 ? '1 directorio' : `${totalDirs} directorios`;
    const archStr = totalArchivos === 1 ? '1 archivo' : `${totalArchivos} archivos`;
    console.log(`  ${dirStr} · ${archStr} en total`);
  }

  iniciarDirectorioCopia(numDir, totalDirs, nombre, totalArchivosDir) {
    const archStr = totalArchivosDir === 1 ? '1 archivo' : `${totalArchivosDir} archivos`;
    console.log(`\n  ▶ [${numDir}/${totalDirs}] ${nombre} — ${archStr}`);
    if (totalArchivosDir === 0) return;
    this._tipoBarraActiva = 'archivos';
    this._barraTotal = totalArchivosDir;
    this._barraInicio = Date.now();
    this._barraActiva = new cliProgress.SingleBar({
      format: '    {bar} {value} / {total} archivos',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      stopOnComplete: false,
    }, cliProgress.Presets.shades_classic);
    this._barraActiva.start(totalArchivosDir, 0);
  }

  actualizarBarraArchivos(n) {
    if (!this._barraActiva) return;
    this._barraActiva.update(n);
  }

  iniciarBarraArchiver() {
    this._tipoBarraActiva = 'archiver';
    this._barraTotal = 0;
    this._barraInicio = Date.now();
    this._barraProcesadoAnterior = 0;
    this._barraTiempoAnterior = Date.now();
    this._barraActiva = new cliProgress.SingleBar({
      format: '  {bar} {percentage}% | {value_fmt} / {total_fmt} | {velocidad}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      stopOnComplete: false,
    }, cliProgress.Presets.shades_classic);
    this._barraActiva.start(100, 0, {
      value_fmt: '0 B',
      total_fmt: '...',
      velocidad: '...',
    });
  }

  actualizarBarraArchiver(data) {
    if (!this._barraActiva) return;
    const total = data.fs.totalBytes || 1;
    const procesado = data.fs.processedBytes || 0;
    const porcentaje = total > 0 ? Math.min(99, Math.floor((procesado / total) * 100)) : 0;

    const ahora = Date.now();
    const deltaTiempo = (ahora - this._barraTiempoAnterior) / 1000;
    const deltaBytes = procesado - this._barraProcesadoAnterior;
    let velocidad = '...';
    if (deltaTiempo > 0.1) {
      velocidad = `${formatBytes(deltaBytes / deltaTiempo)}/s`;
      this._barraProcesadoAnterior = procesado;
      this._barraTiempoAnterior = ahora;
    }
    this._barraTotal = total;
    this._barraActiva.update(porcentaje, {
      value_fmt: formatBytes(procesado),
      total_fmt: formatBytes(total),
      velocidad,
    });
  }

  iniciarBarraBytes(totalBytes) {
    this._tipoBarraActiva = 'bytes';
    this._barraTotal = totalBytes;
    this._barraInicio = Date.now();
    this._barraProcesadoAnterior = 0;
    this._barraTiempoAnterior = Date.now();
    this._barraActiva = new cliProgress.SingleBar({
      format: '  {bar} {percentage}% | {value_fmt} / {total_fmt} | {velocidad}',
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      stopOnComplete: false,
    }, cliProgress.Presets.shades_classic);
    this._barraActiva.start(totalBytes, 0, {
      value_fmt: '0 B',
      total_fmt: formatBytes(totalBytes),
      velocidad: '...',
    });
  }

  actualizarBarraBytes(procesado) {
    if (!this._barraActiva) return;
    const ahora = Date.now();
    const deltaTiempo = (ahora - this._barraTiempoAnterior) / 1000;
    const deltaBytes = procesado - this._barraProcesadoAnterior;
    let velocidad = '...';
    if (deltaTiempo > 0.1) {
      velocidad = `${formatBytes(deltaBytes / deltaTiempo)}/s`;
      this._barraProcesadoAnterior = procesado;
      this._barraTiempoAnterior = ahora;
    }
    this._barraActiva.update(procesado, {
      value_fmt: formatBytes(procesado),
      total_fmt: formatBytes(this._barraTotal),
      velocidad,
    });
  }

  finalizarBarra() {
    if (!this._barraActiva) return;
    const totalMs = Date.now() - this._barraInicio;

    if (this._tipoBarraActiva === 'archivos') {
      this._barraActiva.update(this._barraTotal);
      this._barraActiva.stop();
      this._barraActiva = null;
      this._tipoBarraActiva = null;
      console.log(`    ✓ completado (${formatTiempo(totalMs)})`);
      return;
    }

    const velocidadPromedio = this._barraTotal > 0
      ? `${formatBytes(this._barraTotal / Math.max(0.001, totalMs / 1000))}/s (promedio)`
      : '';
    if (this._tipoBarraActiva === 'archiver') {
      this._barraActiva.update(100, {
        value_fmt: formatBytes(this._barraTotal),
        total_fmt: formatBytes(this._barraTotal),
        velocidad: velocidadPromedio,
      });
    } else {
      this._barraActiva.update(this._barraTotal, {
        value_fmt: formatBytes(this._barraTotal),
        total_fmt: formatBytes(this._barraTotal),
        velocidad: velocidadPromedio,
      });
    }
    this._barraActiva.stop();
    this._barraActiva = null;
    this._tipoBarraActiva = null;
  }

  mensajeSimple(texto) {
    process.stdout.write(`  ${texto} ... `);
    return Date.now();
  }

  mensajeSimpleFin(inicio) {
    process.stdout.write(`✓ (${formatTiempo(Date.now() - inicio)})\n`);
  }

  resumen(nombreArchivo, totalMs, tamano) {
    console.log('\n' + '═'.repeat(ANCHO));
    console.log(`✓ Backup completado: ${nombreArchivo}`);
    console.log(`  Tiempo total: ${formatTiempo(totalMs)} | Tamaño: ${formatBytes(tamano)}`);
    console.log('═'.repeat(ANCHO));
  }
}

module.exports = { ProgresoBackup, formatBytes, formatTiempo };
