# Node-RED PHP Function Node

## Run PHP Functions in Node-RED

Node-RED is an amazing automation tool, but writing functions in JavaScript can sometimes be inconvenient.  
This node allows you to write functions in PHP instead of JavaScript, giving more flexibility to those who prefer PHP.

However, this is an experimental project and not recommended for production.  
If you decide to use it in production, do so at your own risk. And if your boss asks… I warned you.

---

## Installation

Before installing, ensure you have PHP installed on your system.  
This node uses `php` in CLI mode, so it must be accessible from the terminal.

To install the node, run the following command:

npm install -g node-red-contrib-php-function

After installation, restart Node-RED, and the node will be available in the "Function" category.

---

## Usage

This node works just like Node-RED's standard function node, but instead of JavaScript, it allows writing code in PHP.

### Features

- Receives a msg object, which is converted into a PHP associative array ($msg).
- The function must return an associative array or null (to discard the message).
- Supports multiple outputs (outputs), just like the standard function node.

### Example PHP Code

Multiply msg["payload"] by 2 and return the result:

return ["payload" => $msg["payload"] * 2];

If msg["payload"] is 5, the node will output {"payload": 10}.

### Logging and Error Handling

You can use the following functions for debugging and error handling:

node.log("Log message");  
node.warn("Important warning");  
node.error("Something went wrong!");  

To trigger a Catch node, use:

node.error("Error message", $msg);

### Sending Messages

The function can return messages in various formats:

A single message:

return ["payload" => "Hello from PHP"];

Multiple messages to different outputs:

return [  
    ["payload" => "Output 1"],  
    ["payload" => "Output 2"]  
];

If a value is null, that output will be ignored.

---

## Caveats and Limitations

This node is still experimental. Keep the following in mind:

- JSON only: Only JSON-serializable data types are supported. PHP objects or resources will not be sent correctly.
- Messages processed sequentially: PHP is synchronous by nature. Although it runs in a separate subprocess, messages are processed one at a time.
- No sandboxing: The PHP code runs without security restrictions. Do not use this node in untrusted environments.
- Possible concurrency issues: If multiple messages arrive at the node simultaneously, execution might not be optimal.

---

## More Information

For more details on writing function nodes in Node-RED, check the official documentation at nodered.org/docs/writing-functions.html.

If you find bugs or improvements, feel free to open an issue in the repository. Contributions are welcome!

---

### Project Status

Not recommended for production.  
Useful for experimentation and local development.  
Potential improvements in the future.
