import React from "react";
import styled from "styled-components";

import type { DllDetails } from "../../types";

const DropDownDiv = styled.div`
  position: absolute;
  left: 20px;
  z-index: 1000;
  background-color: #636363;
  border-radius: 5px;
  p {
    margin: 0;
    padding: 10px;
    width: 100px;
    cursor: pointer;
    border-radius: 5px;
    &:hover {
      background-color: red;
    }
  }
`;

const DropDownCard = ({
  versions = [],
  setOpen,
  path,
  currentVersion,
  type,
  handleNewVersionSelected,
}: {
  versions: string[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  path: string;
  currentVersion: string;
  type: string;
  handleNewVersionSelected: ({ path, version, type, original }: DllDetails) => void;
}) => {
  return (
    <DropDownDiv>
      {versions.map((version) => (
        <p
          key={version}
          onClick={async () => {
            const res = await window.electron.changeDllVersion(path, version, currentVersion, type);
            setOpen(false);
            if (res) {
              handleNewVersionSelected(res);
            }
          }}
        >
          {version}
        </p>
      ))}
    </DropDownDiv>
  );
};

export default DropDownCard;
