import { shell, BrowserWindow, ipcMain, dialog } from "electron";
import fs from "node:fs";
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
  // Handle download links / intercept dll downloads
  ipcMain.handle("openDownloadLink", handleDownload);
  // Select directory to scan for nvidia dlls
  ipcMain.handle("dialog:scanForNvidiaDlls", recursiveScanDirectoryForNvidiaDLLs(mainWindow));
  //  See what dlls we've already downloaded
  ipcMain.handle("findDownloadedNvidiaDLLs", findDownloadedNvidiaDLLs);
  //  Handle changing versions of dll for a given path
  ipcMain.handle("changeDllVersion", changeDllVersion);
  //  Open downloads folder
  ipcMain.handle("openDownloadedDllsFolder", () => {
    shell.openPath(nvidiaDllFolderPath);
  });

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
    fs.renameSync(path + ".orig", path);
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

  //  If original doesn't exist, backup the current version as the original
  if (!original.exists) {
    fs.renameSync(path, path + ".orig");
  }
  const pathToDownloadedVersion = createPathToDownloadedDll(type, versionToSet);
  fs.copyFileSync(pathToDownloadedVersion, path);
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

  return new Promise((res, rej) => {
    function downloadListener(
      event: Electron.Event,
      item: Electron.DownloadItem,
      webContents: Electron.WebContents
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

  return Promise.all(mappedTypeVersion);
};
