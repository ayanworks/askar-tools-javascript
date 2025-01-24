import { agentDependencies } from "@credo-ts/node"
import { MultiWalletConverter } from "./multiWalletConverter"
import { KeyDerivationMethod } from "@credo-ts/core"

const main = async () => {
  const store = new MultiWalletConverter({
    fileSystem: new agentDependencies.FileSystem(),
    walletConfig: {
      id: "test",
      key: "test",
    },
    tenantId: "test",
  })

  await store.openWallet({
    id: "tenant-718e4d83-ea3a-4fcf-b23d-be3274305b6c",
    key: "HCn4VEXupd3vX1TuBGEqvNJ29kFUmDjZcUqeKJSJtYWi",
    keyDerivationMethod: KeyDerivationMethod.Raw,
  })
}

main()