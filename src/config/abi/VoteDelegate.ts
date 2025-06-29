export const VoteDelegate = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: 'chief_',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'polling_',
          type: 'address'
        },
        {
          internalType: 'address',
          name: 'delegate_',
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
      name: 'Free',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
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
      name: 'Lock',
      type: 'event'
    },
    {
      inputs: [],
      name: 'chief',
      outputs: [
        {
          internalType: 'contract ChiefLike',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'delegate',
      outputs: [
        {
          internalType: 'address',
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
          internalType: 'uint256',
          name: 'wad',
          type: 'uint256'
        }
      ],
      name: 'free',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'gov',
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
          internalType: 'uint256',
          name: 'wad',
          type: 'uint256'
        }
      ],
      name: 'lock',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'polling',
      outputs: [
        {
          internalType: 'contract PollingLike',
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
          name: '',
          type: 'address'
        }
      ],
      name: 'stake',
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
      inputs: [
        {
          internalType: 'bytes32',
          name: 'slate',
          type: 'bytes32'
        }
      ],
      name: 'vote',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address[]',
          name: 'yays',
          type: 'address[]'
        }
      ],
      name: 'vote',
      outputs: [
        {
          internalType: 'bytes32',
          name: 'result',
          type: 'bytes32'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256[]',
          name: 'pollIds',
          type: 'uint256[]'
        },
        {
          internalType: 'uint256[]',
          name: 'optionIds',
          type: 'uint256[]'
        }
      ],
      name: 'votePoll',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'uint256',
          name: 'pollId',
          type: 'uint256'
        },
        {
          internalType: 'uint256',
          name: 'optionId',
          type: 'uint256'
        }
      ],
      name: 'votePoll',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ]
} as const;
