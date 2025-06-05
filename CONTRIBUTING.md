# Contributing

Thank you for your interest in contributing to the Permissionless SKY interface!

# Development

Before running anything, you'll need to install the dependencies:

```
pnpm install
```

## Running the interface locally

```
pnpm start
```

The interface should automatically open. If it does not, navigate to [http://localhost:3000].

## Creating a production build

```
pnpm build
```

To serve the production build:

```
pnpm preview
```

Then, navigate to [http://localhost:4173] to see it.


## Guidelines

The following points should help guide your development:

- Security: the interface is safe to use
  - Avoid adding unnecessary dependencies due to [supply chain risk](https://github.com/LavaMoat/lavamoat#further-reading-on-software-supplychain-security)
- Reproducibility: anyone can build the interface
  - Avoid adding steps to the development/build processes
  - The build must be deterministic, i.e. a particular commit hash always produces the same build
- Decentralization: anyone can run the interface
