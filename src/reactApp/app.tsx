import React, { JSX, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import styled, { createGlobalStyle } from "styled-components";
import "typeface-roboto/index.css";

const root = createRoot(document.body);

import type { DllDetails, VersionsMap } from "../types";
import { Tag } from "./components/tag";
import { versionSorter } from "./modules/helpers";
import { DllEntries } from "./components/dllEntries";

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
  &:after {
    content: "Downloads will be automatically intercepted and added above";
    position: absolute;
    bottom: -20px;
    right: 10px;
    font-size: 14px;
  }
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
const spanMapper = (v: string) => <span key={v}>{v}</span>;
function App() {
  const [scannedDllDetails, setScannedDllDetails] = useState<DllDetails[]>([]);
  const [downloadedDllDetails, setDownloadedDllDetails] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [noResults, setNoResults] = useState(null);

  //  On initial load, find all previously downloaded DLLs
  useEffect(() => {
    window.electron.findDownloadedNvidiaDLLs().then((downloadedDlls) => {
      const mapped: { [key: string]: string[] } = {};
      Object.entries(downloadedDlls).forEach(([key, entry]) => {
        mapped[key] = entry.map(({ version }: { version: string }) => version);
      });
      setDownloadedDllDetails(mapped);
    });
  }, []);

  //  Opens dialog to select a directory for scanning of nvidia dlls
  const openDialogOnClick = async () => {
    setScannedDllDetails([]);
    setNoResults(false);
    setTimeout(() => {
      setIsLoading(true);
    }, 500);
    const dllResults = await window.electron.scanForNvidiaDlls();
    setNoResults(dllResults.length === 0);
    setScannedDllDetails(dllResults);
    setIsLoading(false);
  };

  //  When download link is clicked
  //  Launch download window for dll type, intercept & parse results
  const downloadLinkOnClick = (url: string) => async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const result = await window.electron.openDownloadLink(url);
    if (result !== "not-downloaded") {
      alert("DLL Downloaded and added successfully");
      //  Check if this version already exists
      const versionExists =
        downloadedDllDetails[result.type] &&
        downloadedDllDetails[result.type].find((version) => version === result.version);
      if (!versionExists) {
        if (downloadedDllDetails[result.type]) {
          downloadedDllDetails[result.type].push(result.version);
        } else {
          downloadedDllDetails[result.type] = [result.version];
        }
        //  Trigger re-render
        setDownloadedDllDetails({ ...downloadedDllDetails });
      }
    }
  };

  const handleNewVersionSelected = ({ path, version, type, original }: DllDetails) => {
    const entryIndex = scannedDllDetails.findIndex((value) => value.path === path);
    const updatedDllDetails = [
      ...scannedDllDetails.slice(0, entryIndex),
      { path, version, type, original },
      ...scannedDllDetails.slice(entryIndex + 1),
    ];
    setScannedDllDetails(updatedDllDetails);
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

  const dlss2Spans = (DLSS2Versions.length && DLSS2Versions.map(spanMapper)) || "None";
  const dlss3Spans = (DLSS3Versions.length && DLSS3Versions.map(spanMapper)) || "None";
  const rayReconSpans = (RayReconVersions.length && RayReconVersions.map(spanMapper)) || "None";

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
      </TagExplainer>
      <ScanButton onClick={openDialogOnClick}>
        Select a Directory to Scan For Nvidia Dlls
      </ScanButton>
      {isLoading && (
        <p>Loading... Should be quick, if you selected an entire drive it may take a minute...</p>
      )}
      {noResults && <p>No folder was selected OR Scan finished and found no nvidia dlls</p>}
      <DllEntries
        scannedDllDetails={scannedDllDetails}
        typeVersionsMap={typeVersionsMap}
        handleNewVersionSelected={handleNewVersionSelected}
      />
    </>
  );
}

// export default App;
root.render(<App />);
