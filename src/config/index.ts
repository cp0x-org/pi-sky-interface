export const Mainnet = 1;
export const Arbitrum = 42161;
export const Base = 8453;
export const AnvilTest = 12222;
export const TenderlyTest = 1999999;

export const appConfig = {
  delegatesPerPage: 7
};

export const apiConfig = {
  cp0xDelegate: '0x7B66F88F25B2A484F4059f96fb824c74BcEf77F5',
  cp0x: 'cp0x',
  delegatesInfoMainnet: 'https://vote.sky.money/api/delegates?network=mainnet&delegateType=ALL', // TODO pagination to add shadow delegators
  // delegatesInfoMainnet: 'https://vote.sky.money/api/delegates?network=mainnet',
  delegatedToMainnet: 'https://vote.sky.money/api/address/%s/delegated-to?address=%s&network=mainnet',
  uniswapV2UsdsSkyPool: '0x2621cc0b3f3c079c1db0e80794aa24976f0b9e3c'
} as const;

export const skyConfig = {
  [Mainnet]: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SKY: '0x56072C95FAA701256059aa122697B133aDEd9279',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xbdcfca946b6cdd965f99a839e4435bcdc1bc470b',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3'
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
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xbdcfca946b6cdd965f99a839e4435bcdc1bc470b',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865'
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
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xbdcfca946b6cdd965f99a839e4435bcdc1bc470b',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865'
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
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xbdcfca946b6cdd965f99a839e4435bcdc1bc470b',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865'
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
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce',
      DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A',
      MKRSKYConverter: '0xbdcfca946b6cdd965f99a839e4435bcdc1bc470b',
      LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3',
      USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865'
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

export type SkyContracts = {
  readonly USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F';
  readonly SKY: '0x56072C95FAA701256059aa122697B133aDEd9279';
  readonly MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2';
  readonly DAI: '0x6b175474e89094c44da98b954eedeac495271d0f';
  readonly USDSStakingRewards: '0x38E4254bD82ED5Ee97CD1C4278FAae748d998865';
  readonly SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD';
  readonly StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275';
  readonly ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce';
  readonly DAIUSDSConverter: '0x3225737a9Bbb6473CB4a45b7244ACa2BeFdB276A';
  readonly MKRSKYConverter: '0xbdcfca946b6cdd965f99a839e4435bcdc1bc470b';
  readonly LockStakeEngine: '0xCe01C90dE7FD1bcFa39e237FE6D8D9F569e8A6a3';
};

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
