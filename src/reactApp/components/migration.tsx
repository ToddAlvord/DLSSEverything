import React, { useState, useMemo, useEffect } from "react";
import styled from "styled-components";

import type { dllTypes, DllDetails, VersionsMap } from "../../types";
import { versionSorter } from "../modules/helpers";
import { Tag } from "./tag";

const MigrationSection = styled.div`
  margin: 5px 0;
  border: 1px solid #555;
  border-radius: 5px;
  background-color: #424242;
  padding: 5px;
`;

const MigrationSectionHeader = styled.div`
  cursor: pointer;
  padding: 5px;
  background-color: #3a3a3a;
  border-radius: 3px;
  &:hover {
    background-color: #4a4a4a;
  }
  > span {
    display: inline-block;
    margin: 0;
    width: 20px;
  }
`;

const MigrationRowDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
`;

const MigrationLabel = styled.span<{ $active: boolean }>`
  font-size: 13px;
  color: ${({ $active }) => ($active ? "white" : "#aaa")};
  min-width: 30px;
`;

const MigrationSelect = styled.select`
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid #555;
  background-color: #333;
  color: white;
  font-size: 13px;
  cursor: pointer;
  width: 125px;
`;

const MigrationApply = styled.button`
  padding: 4px 12px;
  background-color: #52aa52;
  border: none;
  border-radius: 3px;
  color: white;
  cursor: pointer;
  font-size: 13px;
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background-color: #419341;
  }
`;

interface MigrationProps {
  scannedDllDetails: DllDetails[];
  typeVersionsMap: VersionsMap;
  onVersionMigrated: (details: DllDetails) => void;
}

const allTypes: dllTypes[] = ["DLSS2", "DLSS3", "RayReconstruction"];

export function Migration({ scannedDllDetails, typeVersionsMap, onVersionMigrated }: MigrationProps) {
  const [migrateSource, setMigrateSource] = useState<{ [key in dllTypes]: string }>({ DLSS2: "", DLSS3: "", RayReconstruction: "" });
  const [migrateTarget, setMigrateTarget] = useState<{ [key in dllTypes]: string }>({ DLSS2: "", DLSS3: "", RayReconstruction: "" });
  const [migrating, setMigrating] = useState<{ [key in dllTypes]: boolean }>({ DLSS2: false, DLSS3: false, RayReconstruction: false });
  const [open, setOpen] = useState(false);

  const modifiedVersionsByType = useMemo(() => {
    const result: { [key in dllTypes]: string[] } = { DLSS2: [], DLSS3: [], RayReconstruction: [] };
    for (const type of allTypes) {
      const modified = scannedDllDetails.filter(d => d.type === type && d.original.exists);
      const unique = Array.from(new Set(modified.map(d => d.version)));
      result[type] = unique.sort(versionSorter);
    }
    return result;
  }, [scannedDllDetails]);

  const handleMigrate = async (type: dllTypes) => {
    const sourceVersion = migrateSource[type];
    const targetVersion = migrateTarget[type];
    if (!sourceVersion || !targetVersion) return;

    setMigrating(prev => ({ ...prev, [type]: true }));
    const targets = scannedDllDetails.filter(d => d.type === type && d.version === sourceVersion && d.original.exists);
    for (const entry of targets) {
      const res = await window.electron.changeDllVersion(entry.path, targetVersion, sourceVersion, type);
      if (res) onVersionMigrated(res);
    }
    setMigrating(prev => ({ ...prev, [type]: false }));
    setMigrateSource(prev => ({ ...prev, [type]: "" }));
    setMigrateTarget(prev => ({ ...prev, [type]: "" }));
  };

  const handleSourceChange = (type: dllTypes, value: string) => {
    setMigrateSource(prev => ({ ...prev, [type]: value }));
    setMigrateTarget(prev => ({ ...prev, [type]: "" }));
  };

  // Reset target selection if the chosen version is no longer available
  useEffect(() => {
    setMigrateTarget(prev => {
      let changed = false;
      const next = { ...prev };
      for (const type of allTypes) {
        if (prev[type] && !typeVersionsMap[type].includes(prev[type])) {
          next[type] = "";
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [typeVersionsMap]);

  return (
    <MigrationSection>
      <MigrationSectionHeader onClick={() => setOpen(!open)}>
        <span>{open ? "\u25bc" : "\u25b6"}</span> Migrate Versions
      </MigrationSectionHeader>
      {open && (
        <div>
          {allTypes.map(type => {
            const sourceVersions = modifiedVersionsByType[type];
            const targetVersions = typeVersionsMap[type].filter(v => v !== migrateSource[type]);
            const dllCount = (v: string) => scannedDllDetails.filter(d => d.type === type && d.version === v && d.original.exists).length;

            return (
              <MigrationRowDiv key={type}>
                <Tag type={type} />
                <MigrationLabel $active={sourceVersions.length > 0}>From:</MigrationLabel>
                <MigrationSelect
                  value={migrateSource[type]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSourceChange(type, e.target.value)}
                  disabled={sourceVersions.length === 0}
                >
                  <option value="">--</option>
                  {sourceVersions.map(v => (
                    <option key={v} value={v}>
                      {v} ({dllCount(v)})
                    </option>
                  ))}
                </MigrationSelect>
                <MigrationLabel $active={!!(migrateSource[type] && targetVersions.length > 0)}>To:</MigrationLabel>
                <MigrationSelect
                  value={migrateTarget[type]}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMigrateTarget(prev => ({ ...prev, [type]: e.target.value }))}
                  disabled={!migrateSource[type] || targetVersions.length === 0}
                >
                  <option value="">--</option>
                  {targetVersions.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </MigrationSelect>
                <MigrationApply
                  onClick={() => handleMigrate(type)}
                  disabled={!migrateSource[type] || !migrateTarget[type] || migrating[type]}
                >
                  Migrate
                </MigrationApply>
              </MigrationRowDiv>
            );
          })}
        </div>
      )}
    </MigrationSection>
  );
}
