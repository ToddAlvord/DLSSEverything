import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import DropDownCard from "./dropDownCard";

import type { originalDll, DllDetails } from "../../types";

const Button = styled.button`
  padding: 5px;
  border-radius: 5px;
  color: #ebebeb;
  background-color: #424242;
  border: none;
  width: 80px;
  text-align: center;
  margin-left: 5px;
  cursor: pointer;
  padding-right: 15px;
  &:after {
    content: "";
    border-top: 0.3em solid;
    border-right: 0.3em solid transparent;
    border-bottom: 0;
    border-left: 0.3em solid transparent;
    color: grey;
    position: absolute;
    right: 8px;
    top: 12px;
  }
`;

export const ButtonWithDropDown = ({
  version,
  availableVersions,
  original,
  path,
  type,
  handleNewVersionSelected,
}: {
  version: string;
  availableVersions: string[];
  original: originalDll;
  path: string;
  type: string;
  handleNewVersionSelected: ({ path, version, type, original }: DllDetails) => void;
}) => {
  const [open, setOpen] = useState(false);
  const drop = useRef(null);
  function handleClick(e: MouseEvent) {
    if (
      !(e.target as HTMLElement)?.closest(`.${drop.current?.className}`) ||
      (e.target as HTMLElement)?.parentElement !== drop.current
    ) {
      setOpen(false);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  let selectableVersions = original.exists ? [`Original (${original.version})`] : [];
  if (availableVersions.length) {
    selectableVersions = selectableVersions.concat(availableVersions);
  }
  if (!selectableVersions.length) {
    selectableVersions = ["<None Available>"];
  }

  return (
    <div
      className="dropdown"
      ref={drop}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <Button onClick={() => setOpen(!open)}> {version}</Button>
      {open && (
        <DropDownCard
          versions={selectableVersions}
          currentVersion={version}
          setOpen={setOpen}
          path={path}
          type={type}
          handleNewVersionSelected={handleNewVersionSelected}
        />
      )}
    </div>
  );
};
