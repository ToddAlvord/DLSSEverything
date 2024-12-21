import React from "react";
import styled from "styled-components";
import "typeface-roboto/index.css";

import { ButtonWithDropDown } from "../components/buttonDropDown";
import type { DllDetails, VersionsMap } from "../../types";
import { Tag } from "../components/tag";

const Container = styled.div`
  margin: 10px;
  display: flex;
`;
const TagAndButton = styled.div`
  flex: 0 0 225px;
`;
const PathStyle = styled.div`
  overflow-wrap: break-word;
  align-self: center;
  overflow: auto;
`;
interface OriginalTagProps {
  $original: boolean;
}
const OriginalTag = styled.span<OriginalTagProps>`
  color: ${({ $original }) => ($original ? "blue" : "green")};
  margin-left: 5px;
  display: inline-block;
  width: 65px;
  text-align: center;
`;

const PathDiv = ({ path }: { path: string }) => {
  const pathWithBreaks = path.split("\\").map((part, index, array) => {
    return (
      <React.Fragment key={index}>
        {part}
        {index < array.length - 1 && (
          <>
            {"\\"}
            <wbr />
          </>
        )}
      </React.Fragment>
    );
  });

  return <PathStyle>{pathWithBreaks}</PathStyle>;
};

function DllEntry({
  details,
  availableVersions,
  handleNewVersionSelected,
}: {
  details: DllDetails;
  availableVersions: string[];
  handleNewVersionSelected: ({ path, version, type, original }: DllDetails) => void;
}) {
  const { path, version, type, original } = details;

  return (
    <Container>
      <TagAndButton>
        <Tag type={type} />
        <ButtonWithDropDown
          version={version}
          availableVersions={availableVersions}
          original={original}
          path={path}
          type={type}
          handleNewVersionSelected={handleNewVersionSelected}
        />
        <OriginalTag $original={original.exists}>
          {original.exists ? "Modified" : "Original"}
        </OriginalTag>
      </TagAndButton>
      <PathDiv path={path} />
    </Container>
  );
}

export function DllEntries({
  scannedDllDetails,
  typeVersionsMap,
  handleNewVersionSelected,
}: {
  scannedDllDetails: DllDetails[];
  typeVersionsMap: VersionsMap;
  handleNewVersionSelected: ({ path, version, type, original }: DllDetails) => void;
}) {
  return (
    <div>
      {scannedDllDetails.map((details, index) => {
        const availableVersions = typeVersionsMap[details.type];
        return (
          <DllEntry
            key={index}
            details={details}
            availableVersions={availableVersions}
            handleNewVersionSelected={handleNewVersionSelected}
          />
        );
      })}
    </div>
  );
}
