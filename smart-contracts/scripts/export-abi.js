import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, "..");
const artifactPath = path.join(root, ".hh3-artifacts", "contracts", "MagaMarketplace.sol", "MagaMarketplace.json");
const outputDir = path.resolve(root, "..", "frontend", "src", "abi");
const outputPath = path.join(outputDir, "MagaMarketplace.json");

async function main() {
  const artifactRaw = await fs.readFile(artifactPath, "utf8");
  const artifact = JSON.parse(artifactRaw);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify({ abi: artifact.abi }, null, 2)}\n`);

  console.log(`ABI exported to: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
