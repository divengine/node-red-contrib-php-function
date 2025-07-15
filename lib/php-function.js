const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PHP_SCRIPT_DIR = "/var/lib/node-red/php-scripts"; // Directory where PHP scripts will be stored

/**
 * Generate an MD5 hash of the given PHP code.
 * @param {string} code - The PHP code to hash.
 * @returns {string} The MD5 hash of the code.
 */
function generateHash(code) {
  return crypto.createHash('md5').update(code).digest('hex');
}

/**
 * Get the absolute path to the PHP script file based on its hash.
 * @param {string} nodeId - The unique ID of the Node-RED node.
 * @param {string} code - The PHP code.
 * @returns {string} The absolute file path for the PHP script.
 */
function getScriptPath(nodeId, code) {
  const hash = generateHash(code);
  return path.join(PHP_SCRIPT_DIR, `${nodeId}_${hash}.php`);
}

/**
 * Ensure that the given directory exists; create it recursively if it does not.
 * @param {string} directory - The directory path to check/create.
 */
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

/**
 * Save the PHP code to a file if it does not already exist.
 * @param {string} nodeId - The unique ID of the Node-RED node.
 * @param {string} code - The PHP code.
 * @returns {string} The absolute path to the saved PHP script.
 */
function savePHPFunction(nodeId, code) {
  ensureDirectoryExists(PHP_SCRIPT_DIR);
  const scriptPath = getScriptPath(nodeId, code);

  if (!fs.existsSync(scriptPath)) {
    fs.writeFileSync(scriptPath, code, 'utf8');
  }

  return scriptPath;
}

/**
 * Spawn a PHP child process to execute the PHP script.
 * Handles stdout, stderr, exit events, and retry attempts.
 * @param {Object} self - The Node-RED node instance.
 */
function spawnPHP(self) {
  const scriptPath = savePHPFunction(self.id, self.func.code);

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
        spawnPHP(self); // Retry if attempts remain
      } else {
        self.error(`Function '${self.name}' failed too many times. Please fix and deploy again.`);
        self.status({ fill: 'red', shape: 'dot', text: 'Stopped, see debug panel' });
      }
    }
  });

  self.log(`PHP function '${self.name}' running on PID ${self.child.pid}`);
  self.status({ fill: 'green', shape: 'dot', text: 'Running' });
}

/**
 * Node-RED node definition for executing custom PHP functions.
 * This node saves the PHP code, runs it as a child process, and passes incoming messages via stdin.
 * @param {Object} config - Node-RED node configuration.
 */
function PHPFunction(config) {
  var self = this;
  RED.nodes.createNode(self, config);
  self.name = config.name;
  self.id = config.id; // Unique Node-RED node ID

  // Generate the full PHP script with a wrapper function to process incoming messages
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
    attempts: 10 // Maximum retry attempts if the PHP process exits unexpectedly
  };

  spawnPHP(self);

  self.on('input', function (msg) {
    var jsonMsg = JSON.stringify(msg);
    self.child.stdin.write(jsonMsg + "\n"); // Send message to PHP process via stdin
  });

  self.on('close', function () {
    self.child.kill(); // Terminate the PHP process when the node is closed
  });
}

// Register the custom node type in Node-RED
RED.nodes.registerType('php-function', PHPFunction);
