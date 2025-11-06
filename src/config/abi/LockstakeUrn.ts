export const lockstakeUrnConfig = {
  abi: [
    {
      inputs: [
        { internalType: 'address', name: 'vat_', type: 'address' },
        { internalType: 'address', name: 'lssky_', type: 'address' }
      ],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      inputs: [],
      name: 'engine',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'farm', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' }
      ],
      name: 'getReward',
      outputs: [{ internalType: 'uint256', name: 'amt', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    { inputs: [], name: 'init', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
      inputs: [],
      name: 'lssky',
      outputs: [{ internalType: 'contract GemLike', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'farm', type: 'address' },
        { internalType: 'uint256', name: 'wad', type: 'uint256' },
        { internalType: 'uint16', name: 'ref', type: 'uint16' }
      ],
      name: 'stake',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'vat',
      outputs: [{ internalType: 'contract VatLike', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'farm', type: 'address' },
        { internalType: 'uint256', name: 'wad', type: 'uint256' }
      ],
      name: 'withdraw',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const;
