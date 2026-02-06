import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(".");
const dist = resolve(root, "dist");
mkdirSync(dist, { recursive: true });

run("bun", ["build", "src/index.tsx", "--outdir", "dist", "--format", "esm"], root);
run(
  "bunx",
  [
    "tsc",
    "--emitDeclarationOnly",
    "--declaration",
    "--declarationMap",
    "--project",
    "tsconfig.json",
  ],
  root,
);

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${cmd} failed`);
  }
}
