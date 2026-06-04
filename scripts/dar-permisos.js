const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { input, password, confirm } = require('@inquirer/prompts');
const { obtenerDatosConf } = require('../funciones/funciones');

const ANCHO = 52;

function titulo(texto) {
  const inner = ANCHO - 2;
  const pad = Math.max(0, inner - texto.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  console.log('\n╔' + '═'.repeat(inner) + '╗');
  console.log('║' + ' '.repeat(left) + texto + ' '.repeat(right) + '║');
  console.log('╚' + '═'.repeat(inner) + '╝');
}

function ejecutarPostgres(host, port, adminUser, adminPass, db, backupUser) {
  // GRANT CONNECT necesita conectarse a la DB destino
  const r1 = spawnSync('psql', [
    '-h', host, '-p', String(port),
    '-U', adminUser, '-d', db,
    '-c', `GRANT CONNECT ON DATABASE "${db}" TO "${backupUser}";`,
  ], {
    env: { ...process.env, PGPASSWORD: adminPass },
    encoding: 'utf8',
  });
  if (r1.status !== 0) return { ok: false, error: r1.stderr?.trim() || 'Error al conectar' };

  // Permisos en todos los esquemas de usuario (excluye pg_* e information_schema)
  const sqlEsquemas = `
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT nspname FROM pg_namespace
    WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'
  LOOP
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO %I', r.nspname, '${backupUser}');
    EXECUTE format('GRANT SELECT ON ALL TABLES IN SCHEMA %I TO %I', r.nspname, '${backupUser}');
    EXECUTE format('GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA %I TO %I', r.nspname, '${backupUser}');
  END LOOP;
END $$;
`;
  const r2 = spawnSync('psql', [
    '-h', host, '-p', String(port),
    '-U', adminUser, '-d', db,
  ], {
    input: sqlEsquemas,
    env: { ...process.env, PGPASSWORD: adminPass },
    encoding: 'utf8',
  });
  if (r2.status !== 0) return { ok: false, error: r2.stderr?.trim() || 'Error al otorgar permisos' };

  return { ok: true };
}

function ejecutarMysql(host, port, adminUser, adminPass, db, backupUser) {
  const sql = [
    `GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON \`${db}\`.* TO '${backupUser}'@'%';`,
    `FLUSH PRIVILEGES;`,
  ].join('\n');

  const r = spawnSync('mysql', [
    '-h', host, '-P', String(port),
    '-u', adminUser,
    '--batch',
    '--execute', sql,
  ], {
    env: { ...process.env, MYSQL_PWD: adminPass },
    encoding: 'utf8',
  });
  if (r.status !== 0) return { ok: false, error: r.stderr?.trim() || 'Error al otorgar permisos' };

  return { ok: true };
}

async function main() {
  const conexionJSON = obtenerDatosConf('conexion_db.conf.json');
  const backupJSON = obtenerDatosConf('backup.conf.json');

  if (!conexionJSON.user || !conexionJSON.host || !conexionJSON.motordb) {
    console.error('\n✗ conf/conexion_db.conf.json está incompleto.');
    console.error('  Ejecutá: npm run inicializar');
    process.exit(1);
  }
  if (!backupJSON.dbs || backupJSON.dbs.length === 0) {
    console.error('\n✗ No hay bases de datos en conf/backup.conf.json.');
    console.error('  Ejecutá: npm run inicializar');
    process.exit(1);
  }

  const { motordb, host, port, user: backupUser } = conexionJSON;
  const { dbs } = backupJSON;

  titulo('CONFIGURAR PERMISOS DE BACKUP');
  console.log(`\n  Motor:            ${motordb}`);
  console.log(`  Host:             ${host}:${port}`);
  console.log(`  Usuario de backup: ${backupUser}`);
  console.log(`  Bases de datos:   ${dbs.join(', ')}\n`);

  const defaultAdmin = motordb === 'postgres' ? 'postgres' : 'root';
  const adminUser = await input({ message: 'Usuario administrador:', default: defaultAdmin });
  const adminPass = await password({ message: 'Contraseña administrador:', mask: '*' });

  const ok = await confirm({
    message: `¿Otorgar permisos de SELECT a "${backupUser}" en ${dbs.length} base(s)?`,
    default: true,
  });
  if (!ok) {
    console.log('Operación cancelada.');
    return;
  }

  console.log('');

  let errores = 0;

  for (const db of dbs) {
    process.stdout.write(`  ▶ ${db} ... `);

    let resultado;
    if (motordb === 'postgres') {
      resultado = ejecutarPostgres(host, port, adminUser, adminPass, db, backupUser);
    } else if (motordb === 'mysql') {
      resultado = ejecutarMysql(host, port, adminUser, adminPass, db, backupUser);
    } else {
      resultado = { ok: false, error: `Motor "${motordb}" no soportado` };
    }

    if (resultado.ok) {
      process.stdout.write('✓\n');
    } else {
      process.stdout.write('✗\n');
      console.error(`    Error: ${resultado.error}`);
      errores++;
    }
  }

  if (errores === 0) {
    console.log(`\n✓ Permisos otorgados en ${dbs.length} base(s).`);
    if (motordb === 'mysql') {
      console.log(`  Nota: permisos otorgados para '${backupUser}'@'%' (cualquier host).`);
    }
  } else {
    console.log(`\n⚠ ${errores} base(s) con errores. Revisá los mensajes anteriores.`);
    process.exit(1);
  }
}

main().catch((error) => {
  if (error?.name === 'ExitPromptError') return;
  console.error('\n✗ Error:', error.message || error);
  process.exit(1);
});
