const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PHP_SCRIPT_DIR = "/var/lib/node-red/php-scripts"; // Carpeta donde se guardarán los scripts PHP

// Genera un hash MD5 del código PHP
function generateHash(code) {
  return crypto.createHash('md5').update(code).digest('hex');
}

// Devuelve la ruta del archivo PHP basado en el hash
function getScriptPath(nodeId, code) {
  const hash = generateHash(code);
  return path.join(PHP_SCRIPT_DIR, `${nodeId}_${hash}.php`);
}

// Crea la carpeta si no existe
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

//Guarda el código PHP en un archivo basado en el hash (si no existe)
function savePHPFunction(nodeId, code) {
  ensureDirectoryExists(PHP_SCRIPT_DIR);
  const scriptPath = getScriptPath(nodeId, code);

  if (!fs.existsSync(scriptPath)) {
    fs.writeFileSync(scriptPath, code, 'utf8');
  }

  return scriptPath;
}

//Lanza el proceso PHP con entrada estándar
function spawnPHP(self) {
  const scriptPath = savePHPFunction(self.id, self.func.code); // Guarda el código PHP solo si es necesario

  self.child = spawn('php', [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  self.child.stdout.on('data', function (data) {
    self.log(data.toString().trim());
  });

  self.child.stderr.on('data', function (data) {
    self.error(data.toString().trim());
  });

  self.child.on('close', function (exitCode) {
    if (exitCode) {
      self.error(`PHP Function process exited with code ${exitCode}`);
      if (self.func.attempts > 0) {
        self.func.attempts--;
        spawnPHP(self); // Reintentar si aún quedan intentos
      } else {
        self.error(`Function '${self.name}' failed too many times. Fix and deploy again.`);
        self.status({ fill: 'red', shape: 'dot', text: 'Stopped, see debug panel' });
      }
    }
  });

  self.log(`PHP function '${self.name}' running on PID ${self.child.pid}`);
  self.status({ fill: 'green', shape: 'dot', text: 'Running' });
}

//Definición del nodo en Node-RED
function PHPFunction(config) {
  var self = this;
  RED.nodes.createNode(self, config);
  self.name = config.name;
  self.id = config.id; // ID único del nodo en Node-RED

  // Código PHP que procesará el payload de entrada estándar (stdin)
  self.func = {
    code: `<?php
function php_function($msg) {
${config.func}
}

$stdin = fopen("php://stdin", "r");
while (($input = fgets($stdin)) !== false) {
    $msg = json_decode(trim($input), true);
    $result = php_function($msg);
    echo json_encode(["_msgid" => $msg["_msgid"], "payload" => $result]) . PHP_EOL;
}
?>`,
    attempts: 10
  };

  spawnPHP(self); // Iniciar el proceso PHP

  self.on('input', function (msg) {
    var jsonMsg = JSON.stringify(msg);
    self.child.stdin.write(jsonMsg + "\n"); // Enviar msg a PHP por entrada estándar
  });

  self.on('close', function () {
    self.child.kill(); // Matar el proceso PHP al cerrar el nodo
  });
}

//Registrar el nodo en Node-RED
RED.nodes.registerType('php-function', PHPFunction);
