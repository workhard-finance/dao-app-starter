import React, { useEffect } from "react";
import { Badge, Row } from "react-bootstrap";
import { useStores } from "../../hooks/user-stores";
import { observer } from "mobx-react";
import { useWorkhard } from "../../providers/WorkhardProvider";
import { useWeb3React } from "@web3-react/core";
import { formatEther } from "ethers/lib/utils";

const Assets: React.FC = observer(() => {
  const { userStore } = useStores();
  const ctx = useWorkhard();
  const { account } = useWeb3React();
  useEffect(() => {
    if (ctx && account) {
      ctx.dao.vision.balanceOf(account).then(userStore.setVisionTokenBalance);
      ctx.dao.commit.balanceOf(account).then(userStore.setVisionTokenBalance);
    }
  }, [ctx, account]);

  return (
    <div style={{ marginRight: "2rem" }}>
      <Row style={{ padding: "0.3rem" }}>
        <Badge pill variant="info">{`${parseFloat(
          formatEther(userStore.visionTokenBalance)
        )} VISION`}</Badge>
      </Row>
      <Row style={{ padding: "0.3rem" }}>
        <Badge pill variant="success">{`${parseFloat(
          formatEther(userStore.commitTokenBalance)
        )} $COMMIT`}</Badge>
      </Row>
    </div>
  );
});
export default Assets;
