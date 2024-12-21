// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  scanForNvidiaDlls: () => ipcRenderer.invoke("dialog:scanForNvidiaDlls"),
  findDownloadedNvidiaDLLs: () => ipcRenderer.invoke("findDownloadedNvidiaDLLs"),
  openDownloadLink: (url: string) => ipcRenderer.invoke("openDownloadLink", url),
  changeDllVersion: (path: string, versionToSet: string, currentVersion: string, type: string) =>
    ipcRenderer.invoke("changeDllVersion", path, versionToSet, currentVersion, type),
  openDownloadedDllsFolder: () => ipcRenderer.invoke("openDownloadedDllsFolder"),
});
