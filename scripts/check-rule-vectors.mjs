import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const rulesDirectory = "src/core/rules";
const vectorsDirectory = join(rulesDirectory, "vectors");
const implementationExtension = /(?<!\.d)\.(?:[cm]?[jt]sx?)$/;

function findImplementationFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "vectors" ? [] : findImplementationFiles(path);
    }
    return implementationExtension.test(entry.name) ? [path] : [];
  });
}

const missingVectors = findImplementationFiles(rulesDirectory)
  .filter((rulePath) => {
    const relativeRulePath = relative(rulesDirectory, rulePath);
    const vectorPath = join(
      vectorsDirectory,
      relativeRulePath.replace(implementationExtension, ".json"),
    );
    return !existsSync(vectorPath);
  })
  .map((rulePath) => relative(rulesDirectory, rulePath));

if (missingVectors.length > 0) {
  console.error("Missing JSON test vectors for core rules:");
  for (const rulePath of missingVectors) console.error(`- ${rulePath}`);
  process.exitCode = 1;
}
