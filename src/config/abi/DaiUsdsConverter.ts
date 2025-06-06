export const daiUsdsConverterConfig = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'daiJoin_',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'usdsJoin_',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'caller',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'usr',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'wad',
          type: 'uint256'
        }
      ],
      name: 'DaiToUsds',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'caller',
          type: 'address'
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'usr',
          type: 'address'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'wad',
          type: 'uint256'
        }
      ],
      name: 'UsdsToDai',
      type: 'event'
    },
    {
      inputs: [],
      name: 'dai',
      outputs: [
        {
          internalType: 'contract GemLike',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'daiJoin',
      outputs: [
        {
          internalType: 'contract DaiJoinLike',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'usr',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'wad',
          type: 'uint256'
        }
      ],
      name: 'daiToUsds',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'usds',
      outputs: [
        {
          internalType: 'contract GemLike',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'usdsJoin',
      outputs: [
        {
          internalType: 'contract UsdsJoinLike',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'usr',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'wad',
          type: 'uint256'
        }
      ],
      name: 'usdsToDai',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const;
