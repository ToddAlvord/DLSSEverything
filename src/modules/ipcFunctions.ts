import { shell, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "node:fs/promises";
import * as nodePath from "path";

import type { DllDetails, downloadedDlls, dllTypes } from "../types";
import { parseDllZip } from "./unzipper";
import { dllTypeMap, defaultHeight, defaultWidth, nvidiaDllFolderPath } from "./constants";
import {
  getFileVersion,
  findNvidiaDllFiles,
  findDownloadedDlls,
  getOriginalFileDetails,
  createPathToDownloadedDll,
} from "./helpers";

//  Create IPCMain Handlers
export function createHandlers(mainWindow: Electron.BrowserWindow) {
  mainWindowRef = mainWindow;
  // Handle download links / intercept dll downloads
  ipcMain.handle("openDownloadLink", handleDownload);
  // Select directory to scan for nvidia dlls
  ipcMain.handle("dialog:scanForNvidiaDlls", recursiveScanDirectoryForNvidiaDLLs(mainWindow));
  // Scan a specific path for nvidia dlls (for favorites)
  ipcMain.handle("scanSpecificDirectoryForNvidiaDlls", scanSpecificDirectoryForNvidiaDLLs);
  //  See what dlls we've already downloaded
  ipcMain.handle("findDownloadedNvidiaDLLs", findDownloadedNvidiaDLLs);
  //  Handle changing versions of dll for a given path
  ipcMain.handle("changeDllVersion", changeDllVersion);
  //  Open downloads folder
  ipcMain.handle("openDownloadedDllsFolder", () => {
    shell.openPath(nvidiaDllFolderPath);
  });
  //  Delete a downloaded DLL version
  ipcMain.handle("deleteDownloadedDll", deleteDownloadedDll);

  //  If we close the main window, close the download window too
  mainWindow.on("close", () => {
    if (downloadWindow && !downloadWindow.isDestroyed()) {
      downloadWindow.close();
    }
  });
}

//  Change a game's DLL to a different version
const changeDllVersion = async (
  event: Electron.IpcMainInvokeEvent,
  path: string,
  versionToSet: string,
  currentVersion: string,
  type: dllTypes
): Promise<DllDetails | void> => {
  if (versionToSet === "<None Available>") {
    return;
  }
  const original = await getOriginalFileDetails(path);
  //  Handle changing back to original version
  if (versionToSet.includes("Original")) {
    if (original.version) {
      await fs.rename(path + ".orig", path);
      return {
        path,
        version: original.version,
        type,
        original: {
          exists: false,
          version: null,
        },
      };
    }
    return;
  }

  //  If original doesn't exist, backup the current version as the original
  if (!original.exists) {
    await fs.rename(path, path + ".orig");
  }
  const pathToDownloadedVersion = createPathToDownloadedDll(type, versionToSet);
  await fs.copyFile(pathToDownloadedVersion, path);
  return {
    path,
    version: versionToSet,
    type,
    original: {
      exists: true,
      version: original.version || currentVersion,
    },
  };
};

//  Open download URL, Intercept zip downloads and process them
let downloadWindow: Electron.BrowserWindow;
let mainWindowRef: Electron.BrowserWindow;
const handleDownload = (event: Electron.IpcMainInvokeEvent, url: string) => {
  if (downloadWindow && !downloadWindow.isDestroyed()) {
    downloadWindow.close();
  }
  downloadWindow = new BrowserWindow({
    width: defaultWidth,
    height: defaultHeight,
    icon: "images/gpu.ico",
  });
  downloadWindow.loadURL(url);
  const [curX, curY] = downloadWindow.getPosition();
  //  Offset download window so you can see both windows
  downloadWindow.setPosition(curX + 50, curY + 50);

  const ses = downloadWindow.webContents.session;

  return new Promise((res) => {
    function downloadListener(
      _event: Electron.Event,
      item: Electron.DownloadItem
    ) {
      const savePath = nodePath.join(nvidiaDllFolderPath, item.getFilename());

      // Set the download location or modify the file
      item.setSavePath(savePath);

      item.on("updated", (event: Electron.Event, state) => {
        // Handle download state updates
        if (state === "interrupted") {
          res("not-downloaded");
        }
      });
      item.once("done", async (event: Electron.Event, state) => {
        if (state === "completed") {
          const parseResult = await parseDllZip(savePath);
          res(parseResult);
          mainWindowRef.webContents.send("download-complete", parseResult);
        } else {
          res("not-downloaded");
        }
      });
    }
    downloadWindow.on("close", () => {
      res("not-downloaded");
      ses.off("will-download", downloadListener);
    });
    ses.on("will-download", downloadListener);
  });
};

//  Find all previously downloaded DLLs
const findDownloadedNvidiaDLLs = async () => {
  const result = await findDownloadedDlls();
  const mappedByType = result.reduce((acc: { [key: string]: downloadedDlls[] }, path: string) => {
    const type = dllTypeMap[path.slice(-5)];
    const entry = { path, version: getFileVersion(path), type };
    acc[type] ? acc[type].push(entry) : (acc[type] = [entry]);
    return acc;
  }, {});
  return mappedByType;
};

//  Scan a specific directory for NVIDIA DLLs (used for favorites)
const scanSpecificDirectoryForNvidiaDLLs = async (event: Electron.IpcMainInvokeEvent, path: string) => {
  let mappedTypeVersion: Promise<DllDetails>[] = [];
  if (path) {
    const dlssDLLFiles = await findNvidiaDllFiles(path);
    mappedTypeVersion = dlssDLLFiles.map(async (path) => {
      return {
        path,
        version: getFileVersion(path),
        type: dllTypeMap[path.slice(-5)],
        original: await getOriginalFileDetails(path),
      };
    });
  }

  return Promise.all(mappedTypeVersion);
};

//  Recursively scan a directory for nvdiaia DLLs
const recursiveScanDirectoryForNvidiaDLLs = (mainWindow: Electron.BrowserWindow) => async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "dontAddToRecent"],
  });

  let mappedTypeVersion: Promise<DllDetails>[] = [];
  if (result.filePaths[0]) {
    const dlssDLLFiles = await findNvidiaDllFiles(result.filePaths[0]);
    mappedTypeVersion = dlssDLLFiles.map(async (path) => {
      return {
        path,
        version: getFileVersion(path),
        type: dllTypeMap[path.slice(-5)],
        original: await getOriginalFileDetails(path),
      };
    });
  }

  return { scannedPath: result?.filePaths?.[0], dlls: await Promise.all(mappedTypeVersion)};
};

//  Delete a downloaded DLL version
const deleteDownloadedDll = async (_event: Electron.IpcMainInvokeEvent, type: dllTypes, version: string) => {
  const filePath = createPathToDownloadedDll(type, version);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
};
