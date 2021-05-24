import React, { useEffect, useState } from "react";
import { Col, Nav, Row, Tab } from "react-bootstrap";
import { useHistory } from "react-router-dom";
import { useParams } from "react-router-dom";
import { BigNumber } from "ethers";
import { useToasts } from "react-toast-notifications";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { errorHandler } from "../../../utils/utils";
import { DAOThumbnail } from "../../../components/contracts/workhard/DAOThumbnail";

const DAOs: React.FC = () => {
  const workhardCtx = useWorkhard();
  const { subtab } = useParams<{ subtab?: string }>();
  const { addToast } = useToasts();
  const history = useHistory();
  // const { account, library, chainId } = useWeb3React();

  const [boostedProjects, setBoostedProjects] = useState<BigNumber[]>(
    [] as BigNumber[]
  );
  const [projects, setProjects] = useState<BigNumber[]>([] as BigNumber[]);

  useEffect(() => {
    if (workhardCtx) {
      const { workhard } = workhardCtx;
      workhard.getAllDAOs().then(setProjects).catch(errorHandler(addToast));
    }
  }, [workhardCtx]); // ensures refresh if referential identity of library doesn't change across chainIds

  return (
    <Tab.Container defaultActiveKey={subtab || "active"}>
      <Row>
        {projects.map((daoId) => (
          <Col key={`all-${daoId}`} md={3}>
            <DAOThumbnail
              daoId={daoId}
              onClick={() => history.push(`/${daoId}/work`)}
            />
            <br />
          </Col>
        ))}
      </Row>
    </Tab.Container>
  );
};

export default DAOs;
