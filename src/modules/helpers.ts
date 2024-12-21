import windowsVersionInfo from "win-version-info";
import fs from "node:fs/promises";
import { nvidiaDllFolderPath, nvidiaDllTypes, nvidiaDllNames } from "./constants";
import path from "path";

export function getFileVersion(path: string) {
  return windowsVersionInfo(path).FileVersion.replace(/,/g, ".").slice(0, -2);
}

// Recursive function to search through directories
async function searchDirectory(
  directory: string,
  foundPaths: string[] = [],
  includeAllDlls: boolean
) {
  const files = await fs.readdir(directory, { withFileTypes: true }).catch(() => {
    //  Catch folder permission errors and ignore them
    return [];
  });

  for (const file of files) {
    const fullPath = path.join(directory, file.name);
    if (file.isDirectory()) {
      // If it's a directory, recurse into it
      await searchDirectory(fullPath, foundPaths, includeAllDlls);
    } else if (
      (includeAllDlls && file.name.endsWith(".dll")) ||
      nvidiaDllNames.includes(file.name)
    ) {
      // If it's a matching DLL file, add it to the results
      foundPaths.push(fullPath);
    }
  }
}

export async function findNvidiaDllFiles(parentDir: string) {
  const foundPaths: string[] = [];
  await searchDirectory(parentDir, foundPaths, false);
  return foundPaths;
}

export async function findDownloadedDlls() {
  const foundPaths: string[] = [];
  await searchDirectory(nvidiaDllFolderPath, foundPaths, true);
  return foundPaths;
}

export const getOriginalFileDetails = async (path: string) => {
  const origPath = path + ".orig";
  const origDllExists: boolean = await fs
    .access(origPath)
    .then(() => true)
    .catch(() => false);

  return {
    exists: origDllExists,
    version: origDllExists ? getFileVersion(origPath) : null,
  };
};

export const createPathToDownloadedDll = (type: keyof typeof nvidiaDllTypes, version: string) => {
  return path.join(nvidiaDllFolderPath, `${version}.${nvidiaDllTypes[type]}`);
};
