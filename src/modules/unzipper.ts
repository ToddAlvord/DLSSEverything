import unzipper from "unzipper";
import fs from "node:fs";
import path from "path";

import { nvidiaDllFolderPath, nvidiaDllNames, dllTypeMap } from "./constants";
import { getFileVersion } from "./helpers";
import type { downloadedDlls } from "../types";

export async function parseDllZip(zipFilePath: string): Promise<downloadedDlls> {
  const outputDir = nvidiaDllFolderPath;

  // if (!fs.existsSync(outputDir)) {
  //   fs.mkdirSync(outputDir, { recursive: true });
  // }
  return new Promise((res, rej) => {
    fs.createReadStream(zipFilePath)
      .pipe(unzipper.Parse())
      .on("entry", (entry: unzipper.Entry) => {
        if (nvidiaDllNames.includes(entry.path)) {
          const outputPath = path.join(outputDir, entry.path);
          entry.pipe(fs.createWriteStream(outputPath)).on("close", () => {
            const fileVersion = getFileVersion(outputPath);
            const versionedPath = path.join(outputDir, fileVersion + "." + entry.path);
            fs.renameSync(outputPath, versionedPath);
            const type = dllTypeMap[entry.path.slice(-5)];
            res({ path: versionedPath, version: fileVersion, type });
          });
        }
      })
      .on("close", () => {
        fs.unlinkSync(zipFilePath);
      })
      .on("error", (err) => {
        console.error("Error extracting zip:", err);
        rej(err);
      });
  });
}
