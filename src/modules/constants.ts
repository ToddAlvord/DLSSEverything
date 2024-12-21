import { app } from "electron";
import path from "path";
import type { dllTypes } from "../types";

export const nvidiaDllTypes = {
  DLSS2: "nvngx_dlss.dll",
  DLSS3: "nvngx_dlssg.dll",
  RayReconstruction: "nvngx_dlssd.dll",
};

export const nvidiaDllNames = Object.values(nvidiaDllTypes);

export const dllTypeMap: { [key: string]: dllTypes } = {
  "s.dll": "DLSS2",
  "g.dll": "DLSS3",
  "d.dll": "RayReconstruction",
};

export const nvidiaDllFolderPath = path.join(app.getPath("userData"), "Nvidia DLSS Dlls");

export const defaultHeight = 800;
export const defaultWidth = 1000;
