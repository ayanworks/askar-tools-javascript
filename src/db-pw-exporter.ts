import { KeyDerivationMethod, WalletConfig, FileSystem } from "@credo-ts/core"
import { Store } from "@hyperledger/aries-askar-nodejs"
import {
  keyDerivationMethodToStoreKeyMethod,
  uriFromWalletConfig,
} from "@credo-ts/askar/build/utils"
import { writeFileSync } from "fs"
import { join } from "path"

interface WalletRecord {
  name: string;
  value: string;
  tags: Record<string, string>;
  category: string;
}

/**
 * Class responsible for exporting wallet data.
 */
class DBPerWalletExporter {
  private walletConfig: WalletConfig
  private fileSystem: FileSystem
  private tenantId: string

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
    this.tenantId = tenantId
  }

  /**
   * Export the wallet data to a JSON file.
   */
  public async exportDBPerWalletData(): Promise<void> {
    try {
      console.log("🚀 ~ Exporter ~ exportWalletData ~ this.walletConfig:", this.walletConfig);
      const askarWalletConfig = await this.getAskarWalletConfig(this.walletConfig);
      const store = await Store.open({
        uri: askarWalletConfig.walletURI.uri,
        keyMethod: askarWalletConfig.keyMethod,
        passKey: askarWalletConfig.passKey,
      });
      console.log("🚀 Store opened:", store);
      await this.processStoreData(store, askarWalletConfig);
    } catch (error) {
      console.error("🚀 ~ Exporter ~ exportWalletData ~ error:", error);
    }
  }

  private async processStoreData(store: any, askarWalletConfig): Promise<void> {
    const data = await this.fetchDataFromStore(store);
    const tenantRecord = this.findTenantRecord(data, this.tenantId);

    if (!tenantRecord) {
      throw new Error('Tenant not found in the base wallet');
    }

    const { walletId, walletKey } = this.extractWalletConfig(tenantRecord);
    console.log(`Wallet ID: ${walletId}`);
    console.log(`Wallet Key: ${walletKey}`);

    const baseUri = askarWalletConfig.walletURI.uri.split('/').slice(0, -1).join('/');
    const tenantUri = `${baseUri}/${walletId}`;

    const tenantStore = await Store.open({
      uri: tenantUri,
      keyMethod: keyDerivationMethodToStoreKeyMethod(KeyDerivationMethod.Raw),
      passKey: walletKey,
    });

    const tenantData = await this.scanStore(tenantStore);
    this.processTenantData(tenantData);
  }

  private async fetchDataFromStore(store: any): Promise<WalletRecord[]> {
    try {
      const scan = store.scan({});
      const records: WalletRecord[] = await scan.fetchAll();
      return records;
    } catch (error) {
      console.error("Error fetching data from store:", error);
      throw new Error("Failed to fetch data from store");
    }
  }

  private findTenantRecord(data: WalletRecord[], tenantId: string): WalletRecord | undefined {
    return data.find(record => record.category === 'TenantRecord' && record.name === tenantId);
  }

  private extractWalletConfig(record: WalletRecord): { walletId: string, walletKey: string } {
    const value = JSON.parse(record.value);
    return {
      walletId: value.config.walletConfig.id,
      walletKey: value.config.walletConfig.key,
    };
  }

  private async scanStore(store: any): Promise<WalletRecord[]> {
    const scan = store.scan({});
    return await scan.fetchAll();
  }

  private processTenantData(data: WalletRecord[]): void {
    const filteredData: Record<string, WalletRecord[]> = {};

    for (const entry of data) {
      if (!filteredData[entry.category]) {
        filteredData[entry.category] = [];
      }
      filteredData[entry.category].push(entry);
    }

    const outputPath = join(__dirname, "../DB_per_wallet_exportedWallet.json")
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
      walletURI: uriFromWalletConfig(walletConfig, this.fileSystem.dataPath),
      keyMethod: keyDerivationMethodToStoreKeyMethod(walletConfig.keyDerivationMethod ?? KeyDerivationMethod.Argon2IMod),
      passKey: walletConfig.key,
    }
  }
}

export default DBPerWalletExporter;