export type dllTypes = "DLSS2" | "DLSS3" | "RayReconstruction";
export type originalDll = {
  exists: boolean;
  version: string | null;
};
export type DllDetails = {
  path: string;
  version: string;
  type: dllTypes;
  original: originalDll;
};

type downloadedDlls = { path: string; version: string; type: dllTypes };
interface VersionsMap {
  DLSS2: string[];
  DLSS3: string[];
  RayReconstruction: string[];
}
