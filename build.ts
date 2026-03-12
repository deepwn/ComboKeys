import { mkdir, rm } from "node:fs/promises";

// Clean dist directory
await rm("dist", { force: true, recursive: true });
await mkdir("dist", { recursive: true });

// Build ESM format using Bun.build API
const formats: { format: "esm"; target: "browser"; suffix: string }[] = [
  { format: "esm", target: "browser", suffix: "" },
];

for (const config of formats) {
  console.log(`Building ${config.format}...`);
  
  const result = await Bun.build({
    entrypoints: ["src/index.ts"],
    outdir: "dist",
    target: config.target,
    format: config.format,
    minify: {
      whitespace: true,
      syntax: true,
      identifiers: true,
    },
    sourcemap: false,
  });
  
  if (!result.success) {
    console.error(`Failed to build ${config.format}:`, result.logs);
    process.exit(1);
  }
}

console.log("Build complete!");
