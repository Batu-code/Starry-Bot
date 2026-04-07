const fs = require("fs");
const path = require("path");

function readFilesRecursively(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...readFilesRecursively(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function loadCommands(client) {
  const commandsDir = path.join(__dirname, "..", "commands");
  const files = readFilesRecursively(commandsDir);
  const payload = [];

  for (const file of files) {
    delete require.cache[require.resolve(file)];
    const command = require(file);

    if (!command?.data || typeof command.execute !== "function") {
      continue;
    }

    client.commands.set(command.data.name, command);
    payload.push(command.data.toJSON());
  }

  return payload;
}

module.exports = {
  loadCommands,
};

