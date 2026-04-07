const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const targets = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "data"].includes(entry.name)) {
        continue;
      }
      walk(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".js")) {
      targets.push(fullPath);
    }
  }
}

walk(path.join(root, "src"));
walk(path.join(root, "scripts"));
if (fs.existsSync(path.join(root, "tests"))) {
  walk(path.join(root, "tests"));
}

let hasFailure = false;

for (const file of targets) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    hasFailure = true;
    process.stderr.write(`Syntax check failed: ${file}\n`);
    process.stderr.write(result.stderr || result.stdout || "");
  }
}

if (hasFailure) {
  process.exit(1);
}

console.log(`Validated ${targets.length} JavaScript files.`);

