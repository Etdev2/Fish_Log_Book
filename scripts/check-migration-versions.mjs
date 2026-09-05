import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const migrationsDir = fileURLToPath(new URL("../supabase/migrations/", import.meta.url));
const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
const versions = new Map();

for (const file of files) {
  const match = /^(\d{14})_/.exec(file);
  if (!match) {
    console.error(`migration filename must start with a 14-digit version: ${file}`);
    process.exitCode = 1;
    continue;
  }

  const version = match[1];
  const existing = versions.get(version) ?? [];
  existing.push(file);
  versions.set(version, existing);
}

const duplicates = [...versions.entries()].filter(([, names]) => names.length > 1);
if (duplicates.length > 0) {
  console.error("duplicate Supabase migration versions detected:");
  for (const [version, names] of duplicates) {
    console.error(`  ${version}: ${names.join(", ")}`);
  }
  process.exitCode = 1;
} else if (!process.exitCode) {
  console.log(`migrations: ${files.length} unique versions.`);
}
