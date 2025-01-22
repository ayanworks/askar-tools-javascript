import { agentDependencies } from "@credo-ts/node"
import { Exporter } from "./exporter"
import { MultiWalletConverter } from "./multiWalletConverter"
import { AskarWalletPostgresStorageConfig } from "@credo-ts/askar"

const storage: AskarWalletPostgresStorageConfig = {
  config: {
    host: "localhost",
  },
}

const main = async () => {
  console.log("Hello World")

  // const exporter = new Exporter({
  //   fileSystem: new agentDependencies.FileSystem(),
  //   walletConfig: {
  //     // id: "issuer-agent-id",
  //     // key: "issuer-agent-key",

  //     id: "tenant-agent-id",
  //     key: "tenant-agent-key",
  //   },
  // })

  // exporter.export()

  // const multiWalletConverter = new MultiWalletConverter({
  //   fileSystem: new agentDependencies.FileSystem(),
  //   walletConfig: {
  //     id: "tenant-agent-id",
  //     key: "tenant-agent-key",
  //     // storage: storage,
  //   },
  //   profileId: "tenant-3064f113-1e00-4171-945b-4987c81decde",
  //   profileKey: "F9XhmAL5E1J8FXgv5jkcixriFEY4mQYqJiJCjFe5JuRP",
  // })

  // await multiWalletConverter.convertSingleWalletToMultiWallet()

  // Open wallet

  const multiWalletConverter = new MultiWalletConverter({
    fileSystem: new agentDependencies.FileSystem(),
    walletConfig: {
      id: "tenant-agent-id",
      key: "tenant-agent-key",
      // storage: storage,
    },
    profileId: "tenant-3064f113-1e00-4171-945b-4987c81decde",
    profileKey: "F9XhmAL5E1J8FXgv5jkcixriFEY4mQYqJiJCjFe5JuRP",
  })

  await multiWalletConverter.openWallet({
    id: "tenant-3064f113-1e00-4171-945b-4987c81decde",
    key: "F9XhmAL5E1J8FXgv5jkcixriFEY4mQYqJiJCjFe5JuRP",
  })
}

main()
