import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import styled, { createGlobalStyle } from "styled-components";
// @ts-expect-error Needs type declaration
import "typeface-roboto/index.css";

const rootEl = document.getElementById("root");

import type { dllTypes, DllDetails, VersionsMap } from "../types";
import pkg from "../../package.json";
import { Tag } from "./components/tag";
import { versionSorter } from "./modules/helpers";
import { DllEntries } from "./components/dllEntries";
import { Favorites } from "./components/favorites";
import { Migration } from "./components/migration";

const GlobalStyle = createGlobalStyle`
  * {
      font-family: roboto;
      color: white;
  }
  body {
    background-color: #505050;
  }
`;
const TagExplainer = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid white;
  border-radius: 3px;
  padding: 10px;
  position: relative;
  div {
    margin-top: 5px;
    a {
      color: #54af7a;
    }
  }
`;
const DownloadsHint = styled.p`
  position: absolute;
  bottom: 5px;
  right: 10px;
  margin: 0;
  font-size: 12px;
  color: #b6b6b6;
`;
const ScanButton = styled.button`
  padding: 5px;
  background-color: #52aa52;
  border-radius: 5px;
  border: none;
  margin-top: 5px;
  cursor: pointer;
`;
const Versions = styled.p`
  padding: 0;
  margin: 10px 0 10px 10px;
  font-size: 14px;
  span {
    border-radius: 3px;
    background-color: #047bc0;
    margin-right: 3px;
    padding: 3px 5px;
  }
`;
const TopLinks = styled.div`
  position: absolute;
  top: 15px;
  right: 25px;
  z-index: 1;
  a {
    margin-left: 15px;
  }
`;
const VersionTag = styled.span`
  border-radius: 3px;
  background-color: #047bc0;
  margin-right: 3px;
  padding: 3px 5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: #ff5555;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  padding: 0 2px;
  line-height: 1;
  margin-left: 2px;
  &:hover {
    color: #ff0000;
  }
`;

function App() {
  const [scannedDllDetails, setScannedDllDetails] = useState<DllDetails[]>([]);
  const [downloadedDllDetails, setDownloadedDllDetails] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [currentlyViewedDirectory, setCurrentlyViewedDirectory] = useState<string | null>(null);

  //  On initial load, find all previously downloaded DLLs
  useEffect(() => {
    window.electron.findDownloadedNvidiaDLLs().then((downloadedDlls) => {
      const mapped: { [key: string]: string[] } = {};
      Object.entries(downloadedDlls).forEach(([key, entry]) => {
        mapped[key] = entry.map(({ version }: { version: string }) => version);
      });
      setDownloadedDllDetails(mapped);
    });

    //  onDownloadComplete returns a remove listener function
    const cleanup = window.electron.onDownloadComplete((result) => {
      alert("DLL Downloaded and added successfully");
      setDownloadedDllDetails(prev => {
        const exists = prev[result.type]?.find((v) => v === result.version);
        if (exists) return prev;
        const next = { ...prev };
        if (next[result.type]) {
          next[result.type] = [...next[result.type], result.version];
        } else {
          next[result.type] = [result.version];
        }
        return next;
      });
    });

    return cleanup;
  }, []);

  // Handle clicking on a favorite to load that directory
  const handleFavoriteClick = async (path: string) => {
    if (isLoading) return;
    setCurrentlyViewedDirectory(path);
    setIsLoading(true);
    setScannedDllDetails([]);

    try {
      const dllResults = await window.electron.scanSpecificDirectoryForNvidiaDlls(path);
      setScannedDllDetails(dllResults);
      setNoResults(dllResults.length === 0);
    } catch (error) {
      console.error("Error scanning directory:", error);
      setScannedDllDetails([]);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scan results to track the directory being scanned
  const openDialogOnClick = async () => {
    setScannedDllDetails([]);
    setNoResults(false);
    setTimeout(() => setIsLoading(true), 500);
    const { dlls: dllResults, scannedPath } = await window.electron.scanForNvidiaDlls();
    setNoResults(dllResults.length === 0);
    setCurrentlyViewedDirectory(scannedPath);
    setScannedDllDetails(dllResults);
    setIsLoading(false);
  };

  //  When download link is clicked
  //  Launch download window for dll type, intercept & parse results
  const downloadLinkOnClick = (url: string) => async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await window.electron.openDownloadLink(url);
  };

  const handleNewVersionSelected = ({ path, version, type, original }: DllDetails) => {
    setScannedDllDetails(prev => {
      const entryIndex = prev.findIndex((value) => value.path === path);
      return [
        ...prev.slice(0, entryIndex),
        { path, version, type, original },
        ...prev.slice(entryIndex + 1),
      ];
    });
  };

  const handleDeleteVersion = async (type: string, version: string) => {
    if (!confirm(`Delete ${type} ${version}?`)) return;
    const success = await window.electron.deleteDownloadedDll(type, version);
    if (success) {
      setDownloadedDllDetails(prev => {
        const next = { ...prev };
        if (next[type]) {
          next[type] = next[type].filter(v => v !== version);
        }
        return next;
      });
    }
  };

  const DLSS2Versions = downloadedDllDetails["DLSS2"]
    ? downloadedDllDetails["DLSS2"].sort(versionSorter)
    : [];
  const DLSS3Versions = downloadedDllDetails["DLSS3"]
    ? downloadedDllDetails["DLSS3"].sort(versionSorter)
    : [];
  const RayReconVersions = downloadedDllDetails["RayReconstruction"]
    ? downloadedDllDetails["RayReconstruction"].sort(versionSorter)
    : [];

  const renderVersionSpans = (versions: string[], type: dllTypes) => {
    if (!versions.length) return "None";
    return versions.map(v => (
      <VersionTag key={v}>
        {v}
        <DeleteBtn onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteVersion(type, v); }}>&times;</DeleteBtn>
      </VersionTag>
    ));
  };

  const dlss2Spans = (DLSS2Versions.length && renderVersionSpans(DLSS2Versions, "DLSS2")) || "None";
  const dlss3Spans = (DLSS3Versions.length && renderVersionSpans(DLSS3Versions, "DLSS3")) || "None";
  const rayReconSpans = (RayReconVersions.length && renderVersionSpans(RayReconVersions, "RayReconstruction")) || "None";

  const typeVersionsMap: VersionsMap = {
    DLSS2: DLSS2Versions,
    DLSS3: DLSS3Versions,
    RayReconstruction: RayReconVersions,
  };
  const hasDownloads =
    Object.values(downloadedDllDetails).reduce((acc, cur) => acc + cur.length, 0) !== 0;

  return (
    <>
      <GlobalStyle />
      <TopLinks>
        {hasDownloads && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.electron.openDownloadedDllsFolder();
            }}
          >
            Downloads ⭧
          </a>
        )}
        <a href="https://github.com/ToddAlvord/DLSSEverything" target="_blank">
          GitHub ⭧
        </a>
        <span style={{ marginLeft: '15px', color: '#888', fontSize: '12px' }}>v{pkg.version}</span>
      </TopLinks>
      <TagExplainer>
        <div>
          <Tag type="DLSS2" /> Frame Upscaling{" "}
          <a
            href="#"
            onClick={downloadLinkOnClick("https://www.techpowerup.com/download/nvidia-dlss-dll/")}
          >
            Download
          </a>
          <Versions>Versions: {dlss2Spans}</Versions>
        </div>
        <div>
          <Tag type="DLSS3" /> Frame Generation{" "}
          <a
            href="#"
            onClick={downloadLinkOnClick(
              "https://www.techpowerup.com/download/nvidia-dlss-3-frame-generation-dll/"
            )}
          >
            Download
          </a>
          <Versions>Versions: {dlss3Spans}</Versions>
        </div>
        <div>
          <Tag type="RayReconstruction" /> Ray Reconstruction{" "}
          <a
            href="#"
            onClick={downloadLinkOnClick(
              "https://www.techpowerup.com/download/nvidia-dlss-3-ray-reconstruction-dll/"
            )}
          >
            Download
          </a>
          <Versions>Versions: {rayReconSpans}</Versions>
        </div>
      <DownloadsHint>Downloads will be automatically intercepted and added here</DownloadsHint>
      </TagExplainer>

      <ScanButton onClick={openDialogOnClick}>
        Select a Directory to Scan For Nvidia Dlls
      </ScanButton>

      <Favorites
        currentlyViewedDirectory={currentlyViewedDirectory}
        onFavoriteClick={handleFavoriteClick}
        isLoading={isLoading}
      />

      <Migration
        key={currentlyViewedDirectory || "initial"}
        scannedDllDetails={scannedDllDetails}
        typeVersionsMap={typeVersionsMap}
        onVersionMigrated={handleNewVersionSelected}
      />

      {isLoading && (
        <p>Loading... Should be quick, if you selected an entire drive it may take a minute...</p>
      )}
      {noResults && !isLoading && <p>No NVIDIA DLLs found in this directory</p>}
      <DllEntries
        scannedDllDetails={scannedDllDetails}
        typeVersionsMap={typeVersionsMap}
        handleNewVersionSelected={handleNewVersionSelected}
      />
    </>
  );
}

// export default App;
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
