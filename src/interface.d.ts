import type { downloadedDlls, DllDetails } from "./types";
export interface IElectronAPI {
  scanForNvidiaDlls: () => Promise<{scannedPath: string, dlls: DllDetails[]}>;
  scanSpecificDirectoryForNvidiaDlls: (path: string) => Promise<DllDetails[]>;
  findDownloadedNvidiaDLLs: () => Promise<{ [key: string]: downloadedDlls[] }>;
  openDownloadLink: (url: string) => downloadedDlls | "not-downloaded";
  changeDllVersion: (
    path: string,
    versionToSet: string,
    currentVersion: string,
    type: string
  ) => Promise<DllDetails | void>;
  openDownloadedDllsFolder: () => void;
  deleteDownloadedDll: (type: string, version: string) => Promise<boolean>;
  onDownloadComplete: (callback: (result: downloadedDlls) => void) => () => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
