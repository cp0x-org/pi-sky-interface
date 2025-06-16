export const VoteDelegateFactory = {
  abi: [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_chief',
          type: 'address'
        },
        {
          internalType: 'address',
          name: '_polling',
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
          indexed: true,
          internalType: 'address',
          name: 'voteDelegate',
          type: 'address'
        }
      ],
      name: 'CreateVoteDelegate',
      type: 'event'
    },
    {
      inputs: [],
      name: 'chief',
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
      inputs: [],
      name: 'create',
      outputs: [
        {
          internalType: 'address',
          name: 'voteDelegate',
          type: 'address'
        }
      ],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'voteDelegate',
          type: 'address'
        }
      ],
      name: 'created',
      outputs: [
        {
          internalType: 'uint256',
          name: 'created',
          type: 'uint256'
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
        }
      ],
      name: 'delegates',
      outputs: [
        {
          internalType: 'address',
          name: 'voteDelegate',
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
        }
      ],
      name: 'isDelegate',
      outputs: [
        {
          internalType: 'bool',
          name: 'ok',
          type: 'bool'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'polling',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address'
        }
      ],
      stateMutability: 'view',
      type: 'function'
    }
  ]
} as const;
