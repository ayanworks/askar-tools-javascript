import {
  keyDerivationMethodToStoreKeyMethod,
  uriFromWalletConfig,
} from "@credo-ts/askar/build/utils"
import { WalletConfig, FileSystem, KeyDerivationMethod } from "@credo-ts/core"
import { Store } from "@hyperledger/aries-askar-nodejs"

export class MultiWalletConverter {
  private walletConfig: WalletConfig
  private fileSystem: FileSystem
  private profileId: string

  public constructor({
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
    this.profileId = "tenant-" + tenantId
  }

  public async run() {
    try {
      console.log("🚀 ~ MultiWalletConverter ~ run ~ this.walletConfig:", this.walletConfig)
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

      // Find the tenant record by name
      const tenantRecord = data.find(
        (rec) => rec.name === this.profileId.split("tenant-")[1]
      )

      console.log(
        "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ data:",
        tenantRecord
      )

      // @ts-ignore - We are picking the key from the tenant record
      const tenantWalletKey = JSON.parse(tenantRecord?.value)["config"][
        "walletConfig"
      ]["key"]

      const tenantStore = await Store.open({
        uri: askarWalletConfig.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
        profile: this.profileId,
      })

      const tenantScan = tenantStore.scan({})
      const tenantData = await tenantScan.fetchAll()
      console.log(
        "🚀 ~ MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ data:",
        tenantData
      )

      if (!tenantStore) {
        throw new Error("Tenant Store not found")
      }

      const newTenantWalletConfig = await this.getAskarWalletConfig({
        id: this.profileId,
        key: tenantWalletKey,
        storage: this.walletConfig.storage,
        // tenant uses raw key derivation method if we want to change the key we need to change using rekey
        // https://github.com/openwallet-foundation/credo-ts/blob/main/packages/tenants/src/services/TenantRecordService.ts#L31
        keyDerivationMethod: KeyDerivationMethod.Raw,
      })

      if (newTenantWalletConfig.path) {
        await this.fileSystem.createDirectory(newTenantWalletConfig.path)
      }

      await tenantStore.copyTo({
        recreate: false,
        uri: newTenantWalletConfig.uri,
        keyMethod: newTenantWalletConfig.keyMethod,
        passKey: newTenantWalletConfig.passKey,
      })

      const newTenantStore = await Store.open({
        uri: newTenantWalletConfig.uri,
        keyMethod: newTenantWalletConfig.keyMethod,
        passKey: newTenantWalletConfig.passKey,
      })

      const newProfiles = await newTenantStore.listProfiles()

      await newTenantStore.setDefaultProfile(this.profileId)

      for await (const profile of newProfiles) {
        if (profile !== this.profileId) {
          await newTenantStore.removeProfile(profile)
        }
      }
     await  newTenantStore.rekey({ passKey: newTenantWalletConfig.passKey,
        keyMethod: keyDerivationMethodToStoreKeyMethod(KeyDerivationMethod.Argon2IMod)})

      await newTenantStore.close()
      await tenantStore.close()
      await adminStore.close()
    } catch (error) {
      console.error(
        "MultiWalletConverter ~ convertSingleWalletToMultiWallet ~ error:",
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

      // @ts-ignore - We can have category as optional in the scan method
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
