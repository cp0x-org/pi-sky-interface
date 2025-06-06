export const mkrSkyConverterConfig = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'mkr_',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'sky_',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'rate_',
          type: 'uint256'
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
          name: 'mkrAmt',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'skyAmt',
          type: 'uint256'
        }
      ],
      name: 'MkrToSky',
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
          name: 'skyAmt',
          type: 'uint256'
        },
        {
          indexed: false,
          internalType: 'uint256',
          name: 'mkrAmt',
          type: 'uint256'
        }
      ],
      name: 'SkyToMkr',
      type: 'event'
    },
    {
      inputs: [],
      name: 'mkr',
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
      inputs: [
        {
          internalType: 'address',
          name: 'usr',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'mkrAmt',
          type: 'uint256'
        }
      ],
      name: 'mkrToSky',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'rate',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'sky',
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
      inputs: [
        {
          internalType: 'address',
          name: 'usr',
          type: 'address'
        },
        {
          internalType: 'uint256',
          name: 'skyAmt',
          type: 'uint256'
        }
      ],
      name: 'skyToMkr',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const;
