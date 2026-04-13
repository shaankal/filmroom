import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const iosDir = join(root, "ios");

let workspace;
try {
  workspace = readdirSync(iosDir).find((f) => f.endsWith(".xcworkspace"));
} catch {
  console.error(
    "\nNo ios/ folder found. Generate it first:\n  npm run ios:prebuild\n"
  );
  process.exit(1);
}

if (!workspace) {
  console.error(`\nNo .xcworkspace under ${iosDir}\n`);
  process.exit(1);
}

const path = join(iosDir, workspace);
console.log(`Opening ${path}`);
execSync(`open "${path}"`, { stdio: "inherit" });
