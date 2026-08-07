# Permissionless SKY Interface by cp0x

**English** | [简体中文](./README.zh-CN.md)

An open-source, permissionless interface for the SKY protocol designed to be fully permissionless and enable direct, unrestricted interaction with smart contracts.

## Languages

The interface is available in English and Simplified Chinese (中文). Use the language switcher in the header to change the language — your choice is stored in the browser and persists across reloads.

## Application Links

- Website: [pi.cp0x.com](https://pi.cp0x.com/)
- Interface: [sky.cp0x.com](https://sky.cp0x.com)
- Twitter: [@cp0xdotcom](https://x.com/cp0xdotcom)
- Telegram: [@cp0xdotcom](https://t.me/cp0xdotcom)

## Protocol Docs

- Docs: [developers.sky.money](https://developers.sky.money/)

## Contributions

For steps on local deployment, development, and code contribution, please see [CONTRIBUTING](./CONTRIBUTING.md).

### Adding or changing translations

Translations live in `src/utils/locales/`:

- `en.json` — English
- `zh.json` — Simplified Chinese

Both files must contain the same set of keys. Copy is rendered through `react-intl` (`<FormattedMessage />` in JSX, `useIntl()` in code), so add a key for any new string instead of hardcoding text in components.

Only static UI copy is translated. Data coming from the API or from smart contracts (balances, addresses, token symbols, transaction hashes) is left untouched.
