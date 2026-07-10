import { FC, SVGProps } from 'react';

import { ReactComponent as SkyIcon } from 'assets/images/sky/ethereum/sky.svg';
import { ReactComponent as SpkIcon } from 'assets/images/sky/ethereum/spk.svg';
export const Mainnet = 1;
export const Arbitrum = 42161;
export const Base = 8453;
export const AnvilTest = 12222;
export const TenderlyTest = 1999999;

export const appConfig = {
  delegatesPerPage: 5
};

export const apiConfig = {
  // cp0xDelegate: '0x7B66F88F25B2A484F4059f96fb824c74BcEf77F5', // old
  cp0xDelegate: '0xb26338C1F190dDF5B7FE61fa6198b06547A5Bc23', //new
  cp0xDelegateOld: '0x7B66F88F25B2A484F4059f96fb824c74BcEf77F5', //old
  cp0xDelegateOld2: '0x2C89024c13A80bC1B662A3dB990524652C15221C', //new
  cp0x: 'cp0x',
  delegatesInfoMainnet: 'https://vote.sky.money/api/delegates?network=mainnet&delegateType=ALL', // TODO pagination to add shadow delegators
  // delegatesInfoMainnet: 'https://vote.sky.money/api/delegates?network=mainnet',
  delegatedToMainnet: 'https://vote.sky.money/api/address/%s/delegated-to?address=%s&network=mainnet',
  uniswapV2UsdsSkyPool: '0x2621cc0b3f3c079c1db0e80794aa24976f0b9e3c',
  uniswapV3UsdcSpkPool: '0x76665642F513aAf2A00bE05711A598F44e3970A7'
} as const;

// cp0x delegate addresses and their display names. Handling of all three must
// stay identical — resolve names / membership only through the helpers below.
// Only `cp0xDelegate` (aligned) is pinned to the top of the delegate list.
export const cp0xDelegates = [
  { address: apiConfig.cp0xDelegate, name: 'cp0x (aligned)' },
  { address: apiConfig.cp0xDelegateOld, name: 'cp0x' },
  { address: apiConfig.cp0xDelegateOld2, name: 'cp0x (old)' }
] as const;

export function getCp0xDelegateName(address?: string | null): string | null {
  if (!address) return null;
  const match = cp0xDelegates.find((d) => d.address.toLowerCase() === address.toLowerCase());
  return match ? match.name : null;
}

export function isCp0xDelegate(address?: string | null): boolean {
  return getCp0xDelegateName(address) !== null;
}

export const skyConfig = {
  [Mainnet]: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      STUSDS: '0x99CD4Ec3f88A45940936F469E4bB72A2A701EEB9',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
      SKYStakingRewards: '0xB44C2Fb4181D7Cb06bdFf34A46FdFe4a259B40Fc',
      SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404', // for stake tab
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af',
      GroveRewards: '0x4E41488C19cD35EB4de3083Fc3e204854c75c86a', // stake USDS to earn GROVE
      GROVE: '0xB30FE1Cf884B48a22a50D22a9282004F2c5E9406', // GROVE reward token
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5'
    },
    features: {},
    icons: {
      dai: '/assets/images/sky/ethereum/dai.svg',
      usds: '/assets/images/sky/ethereum/usds.svg',
      mkr: '/assets/images/sky/ethereum/mkr.svg',
      sky: '/assets/images/sky/ethereum/sky.svg'
    }
  },
  [Arbitrum]: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      STUSDS: '0x99CD4Ec3f88A45940936F469E4bB72A2A701EEB9',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      SKYStakingRewards: '0xB44C2Fb4181D7Cb06bdFf34A46FdFe4a259B40Fc',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af',
      GroveRewards: '0x4E41488C19cD35EB4de3083Fc3e204854c75c86a', // stake USDS to earn GROVE
      GROVE: '0xB30FE1Cf884B48a22a50D22a9282004F2c5E9406', // GROVE reward token
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
      SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404', // for stake tab
      VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5'
    },
    features: {},
    icons: {
      dai: '/assets/images/sky/arbitrum/dai.svg',
      usds: '/assets/images/sky/arbitrum/usds.svg',
      mkr: '/assets/images/sky/arbitrum/mkr.svg',
      sky: '/assets/images/sky/arbitrum/sky.svg'
    }
  },
  [Base]: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      STUSDS: '0x99CD4Ec3f88A45940936F469E4bB72A2A701EEB9',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      SKYStakingRewards: '0xB44C2Fb4181D7Cb06bdFf34A46FdFe4a259B40Fc',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af',
      GroveRewards: '0x4E41488C19cD35EB4de3083Fc3e204854c75c86a', // stake USDS to earn GROVE
      GROVE: '0xB30FE1Cf884B48a22a50D22a9282004F2c5E9406', // GROVE reward token
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
      SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404', // for stake tab
      VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5'
    },
    features: {},
    icons: {
      dai: '/assets/images/sky/base/dai.svg',
      usds: '/assets/images/sky/base/usds.svg',
      mkr: '/assets/images/sky/base/mkr.svg',
      sky: '/assets/images/sky/base/sky.svg'
    }
  },
  [AnvilTest]: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
      SKYStakingRewards: '0xB44C2Fb4181D7Cb06bdFf34A46FdFe4a259B40Fc',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      STUSDS: '0x99CD4Ec3f88A45940936F469E4bB72A2A701EEB9',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af',
      GroveRewards: '0x4E41488C19cD35EB4de3083Fc3e204854c75c86a', // stake USDS to earn GROVE
      GROVE: '0xB30FE1Cf884B48a22a50D22a9282004F2c5E9406', // GROVE reward token
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
      SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404', // for stake tab
      VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5'
    },
    features: {},
    icons: {
      dai: '/assets/images/sky/ethereum/dai.svg',
      usds: '/assets/images/sky/ethereum/usds.svg',
      mkr: '/assets/images/sky/ethereum/mkr.svg',
      sky: '/assets/images/sky/ethereum/sky.svg'
    }
  },
  [TenderlyTest]: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
      SKYStakingRewards: '0xB44C2Fb4181D7Cb06bdFf34A46FdFe4a259B40Fc',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      STUSDS: '0x99CD4Ec3f88A45940936F469E4bB72A2A701EEB9',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af',
      GroveRewards: '0x4E41488C19cD35EB4de3083Fc3e204854c75c86a', // stake USDS to earn GROVE
      GROVE: '0xB30FE1Cf884B48a22a50D22a9282004F2c5E9406', // GROVE reward token
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
      SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404', // for stake tab
      VoteDelegateFactory: '0x4cf3daefa2683cd18df00f7aff5169c00a9eccd5'
    },
    features: {},
    icons: {
      dai: '/assets/images/sky/ethereum/dai.svg',
      usds: '/assets/images/sky/ethereum/usds.svg',
      mkr: '/assets/images/sky/ethereum/mkr.svg',
      sky: '/assets/images/sky/ethereum/sky.svg'
    }
  }
} as const;

export const SkyContracts = {
  USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
  SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
  MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
  DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
  STUSDS: '0x99CD4Ec3f88A45940936F469E4bB72A2A701EEB9',
  USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
  SPKStakingRewards: '0x99cbc0e4e6427f6939536ed24d1275b95ff77404',
  SKYStakingRewards: '0xB44C2Fb4181D7Cb06bdFf34A46FdFe4a259B40Fc',
  SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
  StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
  UsdsSpkRewards: '0x173e314C7635B45322cd8Cb14f44b312e079F3af',
  GroveRewards: '0x4E41488C19cD35EB4de3083Fc3e204854c75c86a',
  GROVE: '0xB30FE1Cf884B48a22a50D22a9282004F2c5E9406',
  ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
  DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
  MKRSKYConverter: '0xA1Ea1bA18E88C381C724a75F23a130420C403f9a',
  LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3'
} as const;

export type SkyContracts = typeof SkyContracts;

export type SkyIcons =
  | {
      readonly dai: '/assets/images/sky/ethereum/dai.svg';
      readonly usds: '/assets/images/sky/ethereum/usds.svg';
      readonly mkr: '/assets/images/sky/ethereum/mkr.svg';
      readonly sky: '/assets/images/sky/ethereum/sky.svg';
    }
  | {
      readonly dai: '/assets/images/sky/arbitrum/dai.svg';
      readonly usds: '/assets/images/sky/arbitrum/usds.svg';
      readonly mkr: '/assets/images/sky/arbitrum/mkr.svg';
      readonly sky: '/assets/images/sky/arbitrum/sky.svg';
    }
  | {
      readonly dai: '/assets/images/sky/base/dai.svg';
      readonly usds: '/assets/images/sky/base/usds.svg';
      readonly mkr: '/assets/images/sky/base/mkr.svg';
      readonly sky: '/assets/images/sky/base/sky.svg';
    };

export interface Token {
  label: string;
  icon: FC<SVGProps<SVGSVGElement>>;
  tokenAddress: string;
}

export const getTokens = (): Token[] => [
  { label: 'SKY', icon: SkyIcon, tokenAddress: SkyContracts.SKYStakingRewards },
  { label: 'SPK', icon: SpkIcon, tokenAddress: SkyContracts.SPKStakingRewards },
  { label: 'USDS (deprecated)', icon: SpkIcon, tokenAddress: SkyContracts.USDSStakingRewards }
];
