const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const keysExternasDir = path.join(__dirname, '..', 'externos');

function validarToken(token) {
  if (!token) {
    const err = new Error("No autorizado");
    err.status = 401;
    throw err;
  }

  let archivos = [];
  try {
    archivos = fs.readdirSync(keysExternasDir).filter(f => f.includes('publicKey.pub'));
  } catch (_) {
    // directorio externos/ no existe o está vacío
  }

  for (const archivo of archivos) {
    const cert = fs.readFileSync(path.join(keysExternasDir, archivo));
    try {
      jwt.verify(token, cert);
      return; // token válido
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        const e = new Error("Token expirado");
        e.status = 401;
        throw e;
      }
      // firma no coincide con esta clave → probar la siguiente
    }
  }

  const e = new Error("Token inválido");
  e.status = 401;
  throw e;
}

function middleware() {
  return function(req, res, next) {
    try {
      validarToken(req.headers.authorization);
      next();
    } catch (err) {
      res.status(err.status || 500).send(err.message || "Error interno");
    }
  };
}

module.exports = { middleware }
