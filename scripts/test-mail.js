const { enviarMail } = require('../funciones/mail');

const TEST_dbs = ['a','b','c']
const TEST_archivos = [
  {"nombre":"deposito", "ruta":"/var/www/servicios/SV-depositos/archivos_depositos"},
  {"nombre":"diversidad", "ruta":"/var/www/servicios/SV-depositos/archovos_diversidad"}
]
const TEST_nombre = "2024-10-27.zip.enc"

enviarMail(TEST_dbs, TEST_archivos, TEST_nombre)