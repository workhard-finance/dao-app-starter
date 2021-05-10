import React from "react";
import Page from "../layouts/Page";
import { Alert, Image, Tab, Tabs } from "react-bootstrap";
import { Link } from "react-router-dom";
import { MyLock } from "../components/contracts/dividend-pool/MyLock";

// move this func to utils
const getVariant = (percent: number) => {
  if (percent <= 25) return "danger";
  else if (percent <= 50) return "warning";
  else if (percent <= 75) return "info";
  else return "success";
};

const Farm = () => {
  const stakePercent = 60;
  const lockedPercent = 90;
  const remainingPercent = 10;
  return (
    <Page>
      <Image
        className="jumbotron"
        src={process.env.PUBLIC_URL + "/images/farm.jpg"}
        style={{ width: "100%", padding: "0px", borderWidth: "5px" }}
      />
      <h1>Farm</h1>
      <Alert variant={"info"}>
        Sow seeds of $VISION and farm yields. To dispatch farmers, you need to
        stake and lock $VISION tokens. You can get $VISION token by{" "}
        <a href="https://app.uniswap.org">trading</a> or{" "}
        <Link to="/mine">mining</Link>!
      </Alert>
      <MyLock />
    </Page>
  );
};

export default Farm;
