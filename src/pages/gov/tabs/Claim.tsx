import React, { useEffect, useState } from "react";
import { BigNumber } from "ethers";
import { Card, Form, ListGroup, Col } from "react-bootstrap";
import { useWorkhard } from "../../../providers/WorkhardProvider";
import { formatEther, getAddress } from "ethers/lib/utils";
import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../../../providers/BlockNumberProvider";
import { ConditionalButton } from "../../../components/ConditionalButton";
import {
  CoingeckoTokenDetails,
  getPriceFromCoingecko,
  getTokenDetailsFromCoingecko,
} from "../../../utils/coingecko";
import { useToasts } from "react-toast-notifications";
import { errorHandler } from "../../../utils/utils";
import { ERC20__factory as IERC20__factory } from "@workhard/protocol";

export interface ClaimProps {}

export const Claim: React.FC<ClaimProps> = ({}) => {
  const { account, library } = useWeb3React();
  const { blockNumber } = useBlockNumber();
  const { addToast } = useToasts();
  const { dao } = useWorkhard() || {};

  const [tokens, setTokens] = useState<string[]>([]);
  const [tokensToClaim, setTokensToWithdraw] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<BigNumber[]>([]);
  const [prices, setPrices] = useState<(number | undefined)[]>([]);
  const [symbols, setSymbols] = useState<string[]>();
  const [details, setDetails] = useState<(CoingeckoTokenDetails | undefined)[]>(
    []
  );
  const [totalInUSD, setTotalInUSD] = useState<number>(0);
  const [lastTx, setLastTx] = useState<string>();

  useEffect(() => {
    if (!!dao && !!account) {
      dao.dividendPool
        .distributedTokens()
        .then(setTokens)
        .catch(errorHandler(addToast));
    }
  }, [account, dao, lastTx]);

  useEffect(() => {
    if (!!dao && !!account) {
      Promise.all(
        tokens.map((token) =>
          dao.dividendPool.connect(account).claimable(token)
        )
      ).then(setAmounts);
    }
  }, [account, dao, blockNumber, tokens, lastTx]);

  useEffect(() => {
    if (!!library && !!tokens) {
      Promise.all(
        tokens.map((token) => IERC20__factory.connect(token, library).symbol())
      ).then(setSymbols);
    }
  }, [library, tokens]);

  useEffect(() => {
    Promise.all(tokens.map((token) => getPriceFromCoingecko(token))).then(
      setPrices
    );
    Promise.all(
      tokens.map((token) => getTokenDetailsFromCoingecko(token))
    ).then(setDetails);
    setTokensToWithdraw(tokens);
  }, [tokens]);

  useEffect(() => {
    if (tokens.length === amounts.length && tokens.length === prices.length) {
      const sum = amounts.reduce((acc, curr, i) => {
        return acc + parseFloat(formatEther(curr)) * (prices[i] || 0);
      }, 0);
      setTotalInUSD(sum);
    }
  }, [amounts, prices]);

  const isSynced = () => {
    return tokens.length === prices.length && tokens.length === details.length;
  };

  const valueInUSD = (amount?: BigNumber, price?: number) => {
    if (!!amount && !!price) {
      return parseFloat(formatEther(amount)) * price;
    } else {
      return 0;
    }
  };

  const claim = () => {
    if (!account || !dao) {
      alert("Not connected");
      return;
    }
    const signer = library.getSigner(account);
    dao.dividendPool
      .connect(signer)
      .claimBatch(tokensToClaim)
      .then((tx) => {
        tx.wait().then((receipt) => {
          setLastTx(receipt.transactionHash);
        });
      })
      .catch((err) => alert(err));
  };

  const isChecked = (addr: string): boolean => {
    return (
      tokensToClaim?.find((t) => getAddress(t) === getAddress(addr)) !==
      undefined
    );
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Total dividends</Card.Title>
        <Card.Text style={{ fontSize: "3rem" }}>$ {totalInUSD}</Card.Text>
        {tokens.length > 0 && (
          <ListGroup className="list-group-flush">
            {isSynced() &&
              tokens.map((token, i) => (
                <ListGroup.Item key={`withdraw-${token}-${i}`}>
                  <Col>
                    <Form.Check
                      label={`${
                        symbols ? symbols[i] : details[i]?.symbol || "?"
                      }: ${formatEther(amounts[i] || "0")} ($${valueInUSD(
                        amounts[i],
                        prices[i]
                      )})`}
                      type="checkbox"
                      onChange={(_) => {
                        const _tokensToClaim = isChecked(token)
                          ? tokensToClaim?.filter(
                              (t) => getAddress(t) !== getAddress(token)
                            )
                          : [...(tokensToClaim || []), token];
                        setTokensToWithdraw(_tokensToClaim);
                      }}
                      checked={isChecked(token)}
                    />
                  </Col>
                </ListGroup.Item>
              ))}
          </ListGroup>
        )}
        <br />
        <ConditionalButton
          enabledWhen={tokensToClaim.length !== 0}
          whyDisabled={"You must choose at least 1 token to claim."}
          onClick={claim}
          children="Claim"
        />
      </Card.Body>
    </Card>
  );
};
