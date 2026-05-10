// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  scanForNvidiaDlls: () => ipcRenderer.invoke("dialog:scanForNvidiaDlls"),
  scanSpecificDirectoryForNvidiaDlls: (path: string) => ipcRenderer.invoke("scanSpecificDirectoryForNvidiaDlls", path),
  findDownloadedNvidiaDLLs: () => ipcRenderer.invoke("findDownloadedNvidiaDLLs"),
  openDownloadLink: (url: string) => ipcRenderer.invoke("openDownloadLink", url),
  changeDllVersion: (path: string, versionToSet: string, currentVersion: string, type: string) =>
    ipcRenderer.invoke("changeDllVersion", path, versionToSet, currentVersion, type),
  openDownloadedDllsFolder: () => ipcRenderer.invoke("openDownloadedDllsFolder"),
  deleteDownloadedDll: (type: string, version: string) => ipcRenderer.invoke("deleteDownloadedDll", type, version),
  onDownloadComplete: (callback: (result: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: unknown) => callback(result);
    ipcRenderer.on("download-complete", listener);
    return () => ipcRenderer.removeListener("download-complete", listener);
  },
});
