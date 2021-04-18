export const getPriceFromCoingecko = (
  address: string,
  currency?: "USD"
): Promise<number | undefined> => {
  const vsCurrency = currency || "USD";
  return new Promise<number | undefined>((resolve) => {
    if (process.env.NODE_ENV === "development") {
      resolve(10);
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
  description: string;
}
export const getTokenDetailsFromCoingecko = (
  address: string
): Promise<CoingeckoTokenDetails | undefined> => {
  return new Promise<CoingeckoTokenDetails | undefined>((resolve) => {
    fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          resolve(undefined);
        } else {
          const { name, symbol, image, description } = json;
          resolve({
            name,
            symbol,
            image: image.small,
            description: description.en,
          });
        }
      })
      .catch(() => resolve(undefined));
  });
};
