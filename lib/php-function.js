module.exports = function (RED) {
  var spawn = require('child_process').spawn;
  var util = require('util');

  function spawnPHP(self) {
      self.child = spawn('php', ['-f', '-'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

      self.child.stdout.on('data', function (data) {
          self.log(data.toString());
      });

      self.child.stderr.on('data', function (data) {
          self.error(data.toString());
      });

      self.child.on('close', function (exitCode) {
          if (exitCode) {
              self.error(`PHP Function process exited with code ${exitCode}`);
              if (self.func.attempts > 0) {
                  spawnPHP(self);
                  self.func.attempts--;
              } else {
                  self.error(`Function '${self.name}' failed more than 10 times. Fix it and deploy again.`);
                  self.status({ fill: 'red', shape: 'dot', text: 'Stopped, see debug panel' });
              }
          }
      });

      self.log(`PHP function '${self.name}' running on PID ${self.child.pid}`);
      self.status({ fill: 'green', shape: 'dot', text: 'Running' });
  }

  function PHPFunction(config) {
      var self = this;
      RED.nodes.createNode(self, config);
      self.name = config.name;

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

      spawnPHP(self);

      self.on('input', function (msg) {
          var jsonMsg = JSON.stringify(msg);
          self.child.stdin.write(jsonMsg + "\n");
      });

      self.on('close', function () {
          self.child.kill();
      });
  }

  RED.nodes.registerType('php-function', PHPFunction);
};
