import {
  keyDerivationMethodToStoreKeyMethod,
  uriFromWalletConfig,
} from "@credo-ts/askar/build/utils"
import { WalletConfig, FileSystem, KeyDerivationMethod } from "@credo-ts/core"
import { Store } from "@hyperledger/aries-askar-nodejs"

export class MultiWalletConverter {
  private walletConfig: WalletConfig
  private fileSystem: FileSystem
  private profileId: string // tenantId
  private profileKey: string // tenantKey

  constructor({
    walletConfig,
    fileSystem,
    profileId,
    profileKey,
  }: {
    walletConfig: WalletConfig
    fileSystem: FileSystem
    profileId: string
    profileKey: string
  }) {
    this.walletConfig = walletConfig
    this.fileSystem = fileSystem
    this.profileId = profileId
    this.profileKey = profileKey
  }

  async getWalletRecords() {}

  async convertSingleWalletToMultiWallet() {
    try {
      const askarWalletConfig = await this.getAskarWalletConfig(
        this.walletConfig
      )
      console.log(
        "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ askarWalletConfig:",
        askarWalletConfig
      )

      // Open the Base Wallet
      const adminStore = await Store.open({
        uri: askarWalletConfig.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
      })

      const scan = adminStore.scan({
        category: "TenantRecord",
      })

      const data = await scan.fetchAll()

      const tenantRecord = data.find(
        (rec) => rec.name === this.profileId.split("tenant-")[1]
      )

      console.log(
        "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ data:",
        tenantRecord
      )

      const tenantStore = await Store.open({
        uri: askarWalletConfig.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
        profile: this.profileId,
      })

      // const tenantScan = tenantStore.scan({})
      // const tenantData = await tenantScan.fetchAll()
      // console.log(
      //   "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ data:",
      //   tenantData
      // )

      if (!tenantStore) {
        throw new Error("Tenant Store not found")
      }

      const newTenantWalletConfig = await this.getAskarWalletConfig({
        id: this.profileId,
        key: this.profileKey,
        // keyDerivationMethod: KeyDerivationMethod.Argon2IMod,
      })

      if (newTenantWalletConfig.path) {
        await this.fileSystem.createDirectory(newTenantWalletConfig.path)
      }
      console.log("check 1")

      await tenantStore.copyTo({
        recreate: false,
        uri: newTenantWalletConfig.uri,
        keyMethod: newTenantWalletConfig.keyMethod,
        passKey: newTenantWalletConfig.passKey,
      })
      console.log("check 2")

      await tenantStore.close()
      console.log("check 3")

      const newTenantStore = await Store.open({
        uri: newTenantWalletConfig.uri,
        keyMethod: newTenantWalletConfig.keyMethod,
        passKey: newTenantWalletConfig.passKey,
        profile: this.profileId,
      })

      const newProfiles = await newTenantStore.listProfiles()

      await newTenantStore.setDefaultProfile(this.profileId)
      console.log(
        "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ newProfiles:",
        newProfiles
      )

      for await (const profile of newProfiles) {
        if (profile !== this.profileId) {
          await newTenantStore.removeProfile(profile)
        }
      }
      await newTenantStore.close()
      console.log("check 4")
    } catch (error) {
      console.log(
        "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ error:",
        error
      )
    }
  }

  public async openWallet(walletConfig: WalletConfig) {
    try {
      const askarWalletConfig = await this.getAskarWalletConfig(walletConfig)

      const store = await Store.open({
        uri: askarWalletConfig.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
      })

      const tenantScan = store.scan({})
      const tenantData = await tenantScan.fetchAll()
      console.log(
        "🚀 ~ MultiWalletConverter ~ openWallet ~ tenantData:",
        tenantData
      )

      await store.close()
    } catch (error) {
      console.log("🚀 ~ MultiWalletConverter ~ openWallet ~ error:", error)
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
}
