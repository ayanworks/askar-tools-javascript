# Askar Tools JavaScript

Askar Tools JavaScript is a utility for managing and exporting wallet data using the Askar library. This project provides tools to convert multi-tenant wallets to multi-wallets and export tenant wallet data to JSON files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Configuration](#configuration)
- [License](#license)

## Installation

To install the dependencies for this project using `pnpm`, run:

```bash
pnpm install

Sure, here is the detailed `README.md` file for your project:

```markdown
# Askar Tools JavaScript

Askar Tools JavaScript is a utility for managing and exporting wallet data using the Askar library. This project provides tools to convert multi-tenant wallets to multi-wallets and export tenant wallet data to JSON files.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Installation

To install the dependencies for this project using `pnpm`, run:

```bash
pnpm install
```

## Usage

You can use the `askar-tools-javascript` command to perform various operations on wallets. The command requires a strategy to be specified, along with other options depending on the strategy.

### Example

To export a tenant wallet to a JSON file:

```bash
node src/index.js --strategy export --wallet-id <wallet-id> --wallet-key <wallet-key> --storage-type <sqlite|postgres> [--postgres-host <host>] [--postgres-username <username>] [--postgres-password <password>] --tenant-id <tenant-id>
```

## Commands

### `--strategy <strategy>`

Specify the strategy to be used. Choose from `mt-convert-to-mw`, `import-tenant`, or `export`.

### `--storage-type <type>`

Specify the storage type. Choose from `sqlite` or `postgres`.

### `--wallet-id <walletName>`

Specify the wallet ID to be migrated.

### `--wallet-key <walletKey>`

Specify the wallet key.

### `--postgres-host <host>`

Specify the host for PostgreSQL storage (optional).

### `--postgres-username <username>`

Specify the username for PostgreSQL storage (optional).

### `--postgres-password <password>`

Specify the password for PostgreSQL storage (optional).

### `--tenant-id <id>`

Specify the tenant ID to be migrated.

## Configuration

The configuration for the wallet is provided through command-line options. Ensure that you provide the correct values for the options based on your storage type and strategy.

## Exporter Class

The `Exporter` class is responsible for exporting wallet data to a JSON file.

### Constructor

```typescript
constructor({
  walletConfig,
  fileSystem,
  tenantId,
}: {
  walletConfig: WalletConfig
  fileSystem: FileSystem
  tenantId: string
})
```

- 

walletConfig

: Configuration for the wallet.
- 

fileSystem

: File system instance.
- `tenantId`: Tenant ID for the profile.

### Methods

#### `export()`

Export the wallet data to a JSON file.

```typescript
public async export(): Promise<void>
```

#### `getDecodedItemsAndTags(store: Store)`

Get decoded items and tags from the store and write them to a JSON file.

```typescript
private async getDecodedItemsAndTags(store: Store): Promise<void>
```

#### 

getAskarWalletConfig(walletConfig: WalletConfig)



Get the Askar wallet configuration.

```typescript
private async getAskarWalletConfig(walletConfig: WalletConfig): Promise<{ uri: string, keyMethod: string, passKey: string }>
```