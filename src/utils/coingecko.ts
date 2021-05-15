export const getPriceFromCoingecko = (
  address: string,
  currency?: "USD"
): Promise<number | undefined> => {
  const vsCurrency = currency || "USD";
  return new Promise<number | undefined>((resolve) => {
    if (process.env.NODE_ENV === "development") {
      resolve(undefined);
    } else {
      fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=${vsCurrency}`
      )
        .then((res) => res.json())
        .then((json) => {
          const tokenPrice = json[address];
          const price = tokenPrice && tokenPrice[vsCurrency];
          resolve(price);
        })
        .catch(() => resolve(undefined));
    }
  });
};

export interface CoingeckoTokenDetails {
  name: string;
  symbol: string;
  image: string;
  description: {
    en: string;
  };
  contract_address: string;
  market_data: {
    current_price: {
      usd: number;
    };
  };
}
export const getTokenDetailsFromCoingecko = (
  address: string
): Promise<CoingeckoTokenDetails | undefined> => {
  return new Promise<CoingeckoTokenDetails | undefined>((resolve) => {
    if (process.env.NODE_ENV === "development") {
      resolve({
        name: `Mock Token - ${address}`,
        symbol: "MOCK",
        image:
          "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png?1600306604",
        description: {
          en: "Mokc API",
        },
        contract_address: address,
        market_data: {
          current_price: {
            usd: 10,
          },
        },
      });
    } else {
      fetch(
        `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
      )
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            resolve(undefined);
          } else {
            const {
              name,
              symbol,
              image,
              description,
              contract_address,
              market_data,
            } = json;
            resolve({
              name,
              symbol,
              image: image.small,
              description,
              contract_address,
              market_data,
            });
          }
        })
        .catch(() => resolve(undefined));
    }
  });
};
