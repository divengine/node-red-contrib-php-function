# Divengine PHP Function Node for Node-RED

**Run PHP functions inside Node-RED flows**

---

Node-RED is a powerful low-code tool for automating tasks and connecting systems.  
By default, all custom logic is written in JavaScript — but what if you prefer PHP?  
This node lets you write and run **PHP code** instead of JavaScript inside your flows.

> ⚠️ **Experimental:** This is an experimental project.  
> It’s **not production-ready**. Use at your own risk — and if your boss asks, you didn’t hear it from us!

---

## ✨ Features

✅ Write Node-RED function logic in PHP  
✅ Receives the `msg` object as an associative PHP array (`$msg`)  
✅ Return a new `$msg` or `null` to drop the message  
✅ Supports multiple outputs, just like the standard Function node  
✅ Logging and error handling are integrated

---

## 📦 Installation

**Prerequisite:**  
Make sure `php` is installed and available in your system’s PATH.  
This node uses PHP in **CLI mode**.

Install globally with npm:

```bash
npm install -g node-red-contrib-php-function
```

Restart Node-RED, and the node will appear under the **“Function”** category.

---

## ⚙️ How to Use

This works just like the standard Function node:  
You write PHP code that processes `msg` and returns a new one.

### 📌 Example

Multiply `msg["payload"]` by 2:

```php
return ["payload" => $msg["payload"] * 2];
```

**Input:** `{ "payload": 5 }`  
**Output:** `{ "payload": 10 }`

---

## 🐞 Logging & Errors

Use these functions for debugging:

```javascript
node.log("Something happened");
node.warn("This might be important");
node.error("Something went wrong!");
```

To trigger a **Catch** node, pass `$msg` as a second parameter:

    node.error("Oops!", $msg);

---

## 🔀 Multiple Outputs

Return an array of messages, one per output.

Example:

```php
return [
  ["payload" => "First output"],
  ["payload" => "Second output"]
];
```

Outputs can be `null` to skip.

---

## ⚡ Limitations

🚧 This project is experimental. Please keep in mind:

- **JSON only:** Only JSON-serializable values are supported.
- **One at a time:** PHP runs synchronously. Each message is processed in order.
- **No sandbox:** Your PHP code runs without security restrictions. Never run untrusted code!
- **Concurrency:** If multiple messages arrive at once, performance may be impacted.

---

## 🧩 Why PHP?

Some teams have legacy PHP systems or developers who prefer PHP syntax.  
This node provides a bridge without rewriting everything in JavaScript.

---

## 🤝 Contributing

We welcome issues, ideas and PRs!  
If you’d like to help improve the node, please:

- 🐛 Open an Issue
- 🔀 Submit a Pull Request
- ⭐ Star the repo if you find it useful!

---

## 📜 License

This project is open source, released under the **MIT License**.  
See `LICENSE` for details.
