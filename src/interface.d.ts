import type { downloadedDlls, DllDetails } from "./types";
export interface IElectronAPI {
  scanForNvidiaDlls: () => Promise<DllDetails[]>;
  findDownloadedNvidiaDLLs: () => Promise<{ [key: string]: downloadedDlls[] }>;
  openDownloadLink: (url: string) => downloadedDlls | "not-downloaded";
  changeDllVersion: (
    path: string,
    versionToSet: string,
    currentVersion: string,
    type: string
  ) => Promise<DllDetails | void>;
  openDownloadedDllsFolder: () => void;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
