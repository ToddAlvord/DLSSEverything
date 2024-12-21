import React, { JSX, useEffect, useRef, useState } from "react";
import styled from "styled-components";

const StyledTag = styled.span`
  padding: 5px;
  border-radius: 5px;
  color: #f3f3f3;
  border: none;
  width: 55px;
  display: inline-block;
  text-align: center;
`;

const Dlss2Tag = styled(StyledTag)`
  background-color: purple;
`;
const Dlss3Tag = styled(StyledTag)`
  background-color: #ffa600;
`;
const DlssRRTag = styled(StyledTag)`
  background-color: red;
`;
const TagMap: { [key: string]: () => JSX.Element } = {
  DLSS2: () => <Dlss2Tag>DLSS2</Dlss2Tag>,
  DLSS3: () => <Dlss3Tag>DLSS3</Dlss3Tag>,
  RayReconstruction: () => <DlssRRTag>RayRec</DlssRRTag>,
};

export function Tag({ type }: { type: string }) {
  const TagType = TagMap[type];
  return <TagType />;
}
