export const Mainnet = 1;
export const Arbitrum = 0;
export const Base = 0;

export const skyConfig = {
  Mainnet: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
      StakingRewards: '0x0650CAF159C5A49f711e8169D4336ECB9b950275',
      ChroniclePoints: '0x10ab606B067C9C461d8893c47C7512472E19e2Ce'
    },
    features: {}
  },
  Arbitrum: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD'
    },
    features: {}
  },
  Base: {
    contracts: {
      USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
      SavingsUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD'
    },
    features: {}
  }
} as const;
