import { KeyDerivationMethod, WalletConfig, FileSystem } from "@credo-ts/core"
import { Store } from "@hyperledger/aries-askar-nodejs"
import {
  keyDerivationMethodToStoreKeyMethod,
  uriFromWalletConfig,
} from "@credo-ts/askar/build/utils"
import { writeFileSync } from "fs"
import { join } from "path"

/**
 * Class responsible for exporting wallet data.
 */
export class Exporter {
  private walletConfig: WalletConfig
  private fileSystem: FileSystem
  private profileId: string

  /**
   * Constructor for the Exporter class.
   * @param walletConfig - Configuration for the wallet.
   * @param fileSystem - File system instance.
   * @param tenantId - Tenant ID for the profile.
   */
  constructor({
    walletConfig,
    fileSystem,
    tenantId,
  }: {
    walletConfig: WalletConfig
    fileSystem: FileSystem
    tenantId: string
  }) {
    this.walletConfig = walletConfig
    this.fileSystem = fileSystem
    this.profileId = `tenant-${tenantId}`
  }

  /**
   * Export the wallet data to a JSON file.
   */
  public async export(): Promise<void> {
    try {
      const askarWalletConfig = await this.getAskarWalletConfig(this.walletConfig)
      const store = await Store.open({
        uri: askarWalletConfig.uri.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
      })
      console.log("🚀 Store opened:", store)
      await this.getDecodedItemsAndTags(store)
    } catch (error) {
      console.error("🚀 ~ Exporter ~ export ~ error:", error)
    }
  }

  /**
   * Get decoded items and tags from the store and write them to a JSON file.
   * @param store - The store instance.
   */
  private async getDecodedItemsAndTags(store: Store): Promise<void> {
    const profiles = await store.listProfiles()
    console.log("🚀 ~ Exporter ~ getDecodedItemsAndTags ~ profiles:", profiles)

    const filteredData: Record<string, any[]> = {}

    const profile = profiles.find(profileId => profileId === this.profileId)
    if (!profile) {
      throw new Error(`Profile with id ${this.profileId} not found`)
    }

    const scan = store.scan({ profile })
    const data = await scan.fetchAll()
    for (const entry of data) {
      if (!filteredData[entry.category]) {
        filteredData[entry.category] = []
      }
      filteredData[entry.category].push(entry)
    }

    // Write filtered data to a JSON file
    const outputPath = join(__dirname, "../sharedTenantExportedWallet.json")
    writeFileSync(outputPath, JSON.stringify(filteredData, null, 2))
    console.log(`Filtered data written to ${outputPath}`)
  }

  /**
   * Get the Askar wallet configuration.
   * @param walletConfig - The wallet configuration.
   * @returns The Askar wallet configuration.
   */
  private async getAskarWalletConfig(walletConfig: WalletConfig) {
    return {
      uri: uriFromWalletConfig(walletConfig, this.fileSystem.dataPath),
      keyMethod: keyDerivationMethodToStoreKeyMethod(walletConfig.keyDerivationMethod ?? KeyDerivationMethod.Argon2IMod),
      passKey: walletConfig.key,
    }
  }
}