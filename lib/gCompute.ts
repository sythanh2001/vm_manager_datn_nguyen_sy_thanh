import {
  InstancesClient,
  MachineImagesClient,
  MachineTypesClient,
  RegionsClient,
  ZoneOperationsClient,
  ZonesClient,
  protos,
} from "@google-cloud/compute";

const credentials = {
  private_key: (process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY as string)
    .split(String.raw`\n`)
    .join("\n"),
  client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
};

const defaultConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  region: "asia-southeast1",
  zone: "asia-east1-b",
  machineType: "e2-small",
  // sourceImage: "projects/debian-cloud/global/images/family/debian-10",
  sourceImage: "projects/f2app-154608/global/machineImages/code-sep-minoring",
  networkName: "global/networks/default",
  diskSizeGb: 30,
};
const getMachineImageList = async function () {
  const machineImagesClient = new MachineImagesClient({ credentials });

  try {
    const [machineImages] = await machineImagesClient.list({
      project: defaultConfig.projectId,
    });

    return machineImages;
  } catch (err) {
    console.error(`Error fetching machine images: ${err}`);
    throw err;
  } finally {
    machineImagesClient.close();
  }
};
const getRegions = async function () {
  const regionsClient = new RegionsClient({ credentials });

  try {
    const [regions] = await regionsClient.list({
      project: defaultConfig.projectId,
    });

    return regions;
  } catch (err) {
    console.error(`Error fetching regions: ${err}`);
    throw err;
  } finally {
    regionsClient.close();
  }
};

const getZones = async function () {
  const zonesClient = new ZonesClient({ credentials });

  try {
    const [zones] = await zonesClient.list({
      project: defaultConfig.projectId,
    });

    return zones;
  } catch (err) {
    console.error(`Error fetching zones: ${err}`);
    throw err;
  } finally {
    zonesClient.close();
  }
};

const getMachineTypes = async function (zone: string) {
  const machineTypesClient = new MachineTypesClient({ credentials });

  try {
    const [machineTypes] = await machineTypesClient.list({
      project: defaultConfig.projectId,
      zone: zone,
    });

    return machineTypes;
  } catch (err) {
    console.error(`Error fetching machine types: ${err}`);
    throw err;
  } finally {
    machineTypesClient.close();
  }
};

const gc = {
  getRegions,
  getZones,
  getMachineTypes,
  getMachineImageList,
  createInstance: async function (
    instanceName: string,
    zone: string = defaultConfig.zone,
    region: string = defaultConfig.region,
    diskSizeGb: number = defaultConfig.diskSizeGb
  ) {
    const instancesClient = new InstancesClient({
      credentials,
    });
    const defaultInsertResource: protos.google.cloud.compute.v1.IInsertInstanceRequest =
      {
        instanceResource: {
          name: instanceName,
          canIpForward: true,
          confidentialInstanceConfig: {
            enableConfidentialCompute: false,
          },
          deletionProtection: false,
          description: "",
          disks: [
            {
              autoDelete: true,
              boot: true,
              deviceName: "instance-uet",
              initializeParams: {
                diskSizeGb: "30",
                diskType:
                  "projects/f2app-154608/zones/us-central1-a/diskTypes/pd-balanced",
                labels: {},
              },
              mode: "READ_WRITE",
              type: "PERSISTENT",
            },
          ],
          displayDevice: {
            enableDisplay: false,
          },
          guestAccelerators: [],
          instanceEncryptionKey: {},
          keyRevocationActionType: "NONE",
          labels: {
            "goog-ec-src": "vm_add-rest",
          },
          machineType: `zones/${zone}/machineTypes/${defaultConfig.machineType}`,
          metadata: {
            items: [
              { key: "domain", value: `${instanceName}.nguyensythanh.id.vn` },
              { key: "managers", value: "a@123.com;test@gmail.com" },
            ],
          },
          minCpuPlatform: "Automatic",
          networkInterfaces: [
            {
              accessConfigs: [
                {
                  name: "External NAT",
                  networkTier: "PREMIUM",
                },
              ],
              stackType: "IPV4_ONLY",
            },
          ],
          params: {
            resourceManagerTags: {},
          },
          reservationAffinity: {
            consumeReservationType: "ANY_RESERVATION",
          },
          scheduling: {
            automaticRestart: true,
            onHostMaintenance: "MIGRATE",
            provisioningModel: "STANDARD",
          },
          serviceAccounts: [
            {
              email: "366344313992-compute@developer.gserviceaccount.com",
              scopes: [
                "https://www.googleapis.com/auth/devstorage.read_only",
                "https://www.googleapis.com/auth/logging.write",
                "https://www.googleapis.com/auth/monitoring.write",
                "https://www.googleapis.com/auth/servicecontrol",
                "https://www.googleapis.com/auth/service.management.readonly",
                "https://www.googleapis.com/auth/trace.append",
              ],
            },
          ],
          shieldedInstanceConfig: {
            enableIntegrityMonitoring: true,
            enableSecureBoot: false,
            enableVtpm: true,
          },
          sourceMachineImage: `projects/${defaultConfig.projectId}/global/machineImages/code-sep-minoring`,
          tags: {
            items: ["http-server"],
          },
          zone: `projects/${defaultConfig.projectId}/zones/${zone}`,
        },
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        zone: zone,
      };

    console.log(
      `Creating the ${instanceName} instance in ${defaultConfig.zone}...`
    );
    const [response] = await instancesClient.insert(defaultInsertResource);
    console.log("🚀 ~ file: gCompute.ts:130 ~ response:", response);

    let operation: any = response.latestResponse;

    const operationsClient = new ZoneOperationsClient({ credentials });
    // Wait for the create operation to complete.
    while (operation.status !== "DONE") {
      console.log("check status");

      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: defaultConfig.projectId,
        zone: operation.zone.split("/").pop(),
      });
      console.log("🚀 ~ file: gCompute.ts:142 ~ operation:", operation);
    }
    return await this.getInstanceInfo(zone, instanceName);
  },
  listAllInstances: async function () {
    const instancesClient = new InstancesClient({
      credentials,
    });
    const aggListRequest = instancesClient.aggregatedListAsync({
      project: defaultConfig.projectId,
    });

    const arr: any[] = [];
    const promises = [];

    for await (const [zone, instancesObject] of aggListRequest) {
      const instances = instancesObject.instances;
      if (instances && instances.length > 0) {
        promises.push(
          Promise.all(
            instances.map(async (i) => {
              const zoneName = zone.split("/").pop();
              arr.push({ ...i, zoneName });
            })
          )
        );
      }
    }

    await Promise.all(promises);
    return arr;
  },

  getInstanceInfo: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({
      credentials,
    });
    try {
      const [instance] = await instancesClient.get({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });

      return instance;
    } catch (err) {
      console.error(`Error fetching VM instance ${instanceName} info: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },
  containsEmail: function (instance: any, targetEmail: string) {
    if (instance.metadata && instance.metadata.items) {
      const managersMetadata = instance.metadata.items.find(
        (item: any) => item.key === "managers"
      );

      if (managersMetadata && managersMetadata.value) {
        const emailList = managersMetadata.value;
        const emails = emailList.split(";");
        return emails.includes(targetEmail);
      }
    }
    return false;
  },
  getInstancesByEmail: async function (email: string) {
    const allInstances = await this.listAllInstances();
    const filteredInstances = allInstances.filter((instance) =>
      this.containsEmail(instance, email)
    );
    return filteredInstances;
  },
  getInstanceListByMetadata: async function (
    metadataKey: string,
    metadataValue: string
  ) {
    const allInstances = await this.listAllInstances();
    const filteredInstances = allInstances.filter((instance) => {
      if (instance.metadata && instance.metadata.items) {
        const metadataItem = instance.metadata.items.find(
          (item: any) =>
            item.key === metadataKey && item.value === metadataValue
        );
        return metadataItem !== undefined;
      }
      return false;
    });
    return filteredInstances;
  },
  getInstanceListByMetadataExist: async function (...metadataKeys: any[]) {
    const allInstances = await this.listAllInstances();
    const filteredInstances = allInstances.filter((instance) => {
      if (instance.metadata && instance.metadata.items) {
        const hasMatchingMetadata = metadataKeys.some((key) =>
          instance.metadata.items.some((item: any) => item.key === key)
        );
        return hasMatchingMetadata;
      }
      return false;
    });
    return filteredInstances;
  },

  getInstancesByName: async function (name: string) {
    const allInstances = await this.listAllInstances();

    for (const instance of allInstances) {
      if (instance.name == name) {
        return Promise.resolve(instance);
      }
    }
    return null;
  },
  getAllZones: async function () {
    const zonesClient = new ZonesClient({ credentials });

    try {
      const [zones] = await zonesClient.list({
        project: defaultConfig.projectId,
      });

      return zones;
    } catch (err) {
      console.error(`Error fetching zones: ${err}`);
      throw err;
    } finally {
      zonesClient.close();
    }
  },
};
export default gc;
