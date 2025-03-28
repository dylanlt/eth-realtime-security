import { Button, Card, Form, notification } from "antd";
import { useMemo, useState } from "react";
import contractInfo from "contracts/contractInfo.json";
import Address from "components/Address/Address";
import { useMoralis, useMoralisQuery } from "react-moralis";
import { getEllipsisTxt } from "helpers/formatters";
import ContractMethods from "./ContractMethods";

export default function Contract() {
  const { Moralis, web3 } = useMoralis();
  const [responses, setResponses] = useState({});
  const { contractName, networks, abi } = contractInfo;

  const contractAddress = useMemo(() => networks[1337].address, [networks]);

  /**Live query */
  const { data } = useMoralisQuery("Events", (query) => query, [], {
    live: true,
  });

  const displayedContractFunctions = useMemo(() => {
    if (!abi) return [];
    return abi.filter((method) => method["type"] === "function");
  }, [abi]);

  const openNotification = ({ message, description }) => {
    notification.open({
      placement: "bottomRight",
      message,
      description,
      onClick: () => {
        console.log("Notification Clicked!");
      },
    });
  };

  const handleOnClick = async () => {
    // export interface TransactionConfig {
    //   from?: string | number;
    //   to?: string;
    //   value?: number | string | BN;
    //   gas?: number | string;
    //   gasPrice?: number | string | BN;
    //   data?: string;
    //   nonce?: number;
    //   chainId?: number;
    //   common?: Common;
    //   chain?: string;
    //   hardfork?: string;
    // }
    // const res = await web3.eth.sendTransaction({
    //   from: "0xb1c74bb547780c7786cc7e9e832b0feee8e8c9ee",
    //   to: "0x73b04472B5AD6423676A56D05c75DC796606C4D9",
    //   value: 1,
    // });

    const res = web3.eth.ens.getAddress();
    console.log(res);
  };

  return (
    <div
      style={{
        margin: "auto",
        display: "flex",
        gap: "20px",
        marginTop: "25",
        width: "70vw",
      }}
    >
      <Button onClick={handleOnClick}>Simulate</Button>
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Your contract: {contractName}
            <Address
              avatar="left"
              copyable
              address={contractAddress}
              size={8}
            />
          </div>
        }
        size="large"
        style={{
          width: "60%",
          boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
          border: "1px solid #e7eaf3",
          borderRadius: "0.5rem",
        }}
      >
        <Form.Provider
          onFormFinish={async (name, { forms }) => {
            const params = forms[name].getFieldsValue();

            let isView = false;

            for (let method of abi) {
              if (method.name !== name) continue;
              if (method.stateMutability === "view") isView = true;
            }

            const options = {
              contractAddress,
              functionName: name,
              abi,
              params,
            };

            if (!isView) {
              const tx = await Moralis.executeFunction({
                awaitReceipt: false,
                ...options,
              });
              tx.on("transactionHash", (hash) => {
                setResponses({
                  ...responses,
                  [name]: { result: null, isLoading: true },
                });
                openNotification({
                  message: "🔊 New Transaction",
                  description: `${hash}`,
                });
                console.log("🔊 New Transaction", hash);
              })
                .on("receipt", (receipt) => {
                  setResponses({
                    ...responses,
                    [name]: { result: null, isLoading: false },
                  });
                  openNotification({
                    message: "📃 New Receipt",
                    description: `${receipt.transactionHash}`,
                  });
                  console.log("🔊 New Receipt: ", receipt);
                })
                .on("error", (error) => {
                  console.error(error);
                });
            } else {
              console.log("options", options);
              Moralis.executeFunction(options).then((response) =>
                setResponses({
                  ...responses,
                  [name]: { result: response, isLoading: false },
                })
              );
            }
          }}
        >
          <ContractMethods
            displayedContractFunctions={displayedContractFunctions}
            responses={responses}
          />
        </Form.Provider>
      </Card>
      <Card
        title={"Contract Events"}
        size="large"
        style={{
          width: "40%",
          boxShadow: "0 0.5rem 1.2rem rgb(189 197 209 / 20%)",
          border: "1px solid #e7eaf3",
          borderRadius: "0.5rem",
        }}
      >
        {data.map((event, key) => (
          <Card
            title={"Transfer event"}
            size="small"
            style={{ marginBottom: "20px" }}
          >
            {getEllipsisTxt(event.attributes.transaction_hash, 14)}
          </Card>
        ))}
      </Card>
    </div>
  );
}
