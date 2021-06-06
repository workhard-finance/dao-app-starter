export const ERC1155 = "0xd9b67a26";
export const ERC721 = "0x80ac58cd";
export const ERC20BurnV1 = "0xb69f83e1";
export const ERC20StakeV1 = "0xe6b7a159";
export const ERC721StakeV1 = "0x13bed0bb";
export const ERC1155StakeV1 = "0x3173499d";
export const ERC1155BurnV1 = "0x4025cdec";

export const ERC165 = {
  ERC1155,
  ERC721,
};

export type Pool =
  | "ERC20BurnV1"
  | "ERC20StakeV1"
  | "ERC721StakeV1"
  | "ERC1155StakeV1"
  | "ERC1155BurnV1";

export type PoolTypeHash =
  | "0xb69f83e1"
  | "0xe6b7a159"
  | "0x13bed0bb"
  | "0x3173499d"
  | "0x4025cdec";

export const PoolType: {
  [pool in Pool]: PoolTypeHash;
} = {
  ERC20BurnV1,
  ERC20StakeV1,
  ERC721StakeV1,
  ERC1155StakeV1,
  ERC1155BurnV1,
};

export const getPoolTypeHash = (poolType: Pool): PoolTypeHash => {
  return PoolType[poolType];
};
