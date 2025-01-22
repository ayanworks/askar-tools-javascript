import { KeyDerivationMethod, WalletConfig, FileSystem } from "@credo-ts/core"
import { Store } from "@hyperledger/aries-askar-nodejs"
import {
  keyDerivationMethodToStoreKeyMethod,
  uriFromWalletConfig,
} from "@credo-ts/askar/build/utils"

export class Exporter {
  private walletConfig: WalletConfig
  private fileSystem: FileSystem

  constructor({
    walletConfig,
    fileSystem,
  }: {
    walletConfig: WalletConfig
    fileSystem: FileSystem
  }) {
    this.walletConfig = walletConfig
    this.fileSystem = fileSystem
  }

  public async export() {
    try {
      const askarWalletConfig = await this.getAskarWalletConfig(
        this.walletConfig
      )

      const tables = { config: {}, items: {}, profiles: {} }
      const store = await Store.open({
        uri: askarWalletConfig.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
      })

      await this.getDecodedItemsAndTags(store)
    } catch (error) {
      console.log("🚀 ~ Exporter ~ export ~ error:", error)
    }
  }

  private async getAskarWalletConfig(walletConfig: WalletConfig) {
    const { uri, path } = uriFromWalletConfig(
      walletConfig,
      this.fileSystem.dataPath
    )

    return {
      uri,
      path,
      profile: walletConfig.id,
      keyMethod: keyDerivationMethodToStoreKeyMethod(
        walletConfig.keyDerivationMethod ?? KeyDerivationMethod.Argon2IMod
      ),
      passKey: walletConfig.key,
    }
  }

  private async getDecodedItemsAndTags(store: Store) {
    // const scan = store.scan({
    //   // category: "StorageVersionRecord",
    // })
    // const data = await scan.fetchAll()
    // console.log("🚀 ~ Exporter ~ getDecodedItemsAndTags ~ data:", data)

    const profiles = await store.listProfiles()
    console.log("🚀 ~ Exporter ~ getDecodedItemsAndTags ~ profiles:", profiles)

    for await (const profile of profiles) {
      const scan = store.scan({
        // category: "StorageVersionRecord",
        profile,
      })
      const data = await scan.fetchAll()
      console.log(
        `🚀 ~ Exporter ~ getDecodedItemsAndTags ~ for profile ${profile} data:`,
        data
      )
    }
  }
}
