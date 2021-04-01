import React, { useState, useEffect } from "react";
// import { Tab } from "react-bootstrap";
// import { useWeb3React } from "@web3-react/core";
// import { useWorkhardContracts } from "../../../providers/WorkhardContractProvider";
// import { BigNumber } from "@ethersproject/bignumber";
// import { ProjectBox } from "../components/ProjectBox";

// export const ActiveProjects: React.FC = () => {
//   const { account, library, chainId } = useWeb3React();
//   const contracts = useWorkhardContracts();

//   const [activeProjects, setActiveProjects] = useState<string[]>(
//     [] as string[]
//   );
//   const [inactiveProjects, setInactiveProjects] = useState<string[]>(
//     [] as string[]
//   );

//   useEffect(() => {
//     if (!!account && !!library && !!chainId && !!contracts) {
//       let stale = false;
//       const { project, projectManager } = contracts;
//       project
//         .totalSupply()
//         .then((n: BigNumber) => {
//           if (!stale) {
//             Array(n.toNumber())
//               .fill(undefined)
//               .map((_, i) => i.toString())
//               .forEach((projId) => {
//                 projectManager.approvedProjects(projId).then((approved) => {
//                   if (approved) {
//                     activeProjects.push(projId);
//                     setActiveProjects([...new Set(activeProjects)]);
//                   } else {
//                     inactiveProjects.push(projId);
//                     setInactiveProjects([...new Set(inactiveProjects)]);
//                   }
//                 });
//               });
//           }
//         })
//         .catch(() => {
//           if (!stale) {
//             setActiveProjects([]);
//             setInactiveProjects([]);
//           }
//         });

//       return () => {
//         stale = true;
//         setActiveProjects([]);
//         setInactiveProjects([]);
//       };
//     }
//   }, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

//   return (
//     <Tab
//       eventKey="activeProjects"
//       title="Active projects"
//       style={{ marginTop: "1rem" }}
//     >
//       <ProjectBox projId={/>
//     </Tab>
//   );
// };
