import { existsSync, mkdirSync, renameSync, readdirSync } from "fs";
import path from "path";

/**
 * 既存のoutputディレクトリをarchiveに退避する。
 * archive/YYYYMMDD-HHmmss-<label>/ の形式で保存。
 */
export function archiveOutput(outputDir: string, label: string): void {
  if (!existsSync(outputDir)) return;

  const entries = readdirSync(outputDir);
  if (entries.length === 0) return;

  const archiveBase = path.join(path.dirname(outputDir), "archive");
  mkdirSync(archiveBase, { recursive: true });

  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);
  const archiveName = `${ts}-${label}`;
  const archivePath = path.join(archiveBase, archiveName);

  renameSync(outputDir, archivePath);
  mkdirSync(outputDir, { recursive: true });

  console.log(`📦 前回の出力をアーカイブ: ${archivePath}`);
}
