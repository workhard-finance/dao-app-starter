import React  from "react";
import { Tab } from "react-bootstrap";
import { ProjectBox } from "./ProjectBox";
import { BigNumberish } from "ethers";

export interface ActiveProjectTabProps {
  projects: BigNumberish[];
}

export const ActiveProjectTab: React.FC<ActiveProjectTabProps> = ({
  projects,
}) => {
  return (
    <Tab
      eventKey="activeProjects"
      title="Active projects"
      style={{ marginTop: "1rem" }}
    >
      {projects.map((id) => (
        <>
          <ProjectBox projId={id} />
          <br />
        </>
      ))}
    </Tab>
  );
};
