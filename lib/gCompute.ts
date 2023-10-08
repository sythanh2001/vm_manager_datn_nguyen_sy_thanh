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
export interface CreateMachineConfig {
  zone: string;
  machineType: string;
  sourceImage: string;
  diskSizeGb: number;
}
const defaultConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  region: "asia-southeast1",
  zone: "asia-east1-b",
  machineType: "e2-small",
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
    zone: string,
    region: string,
    sourceImage: string,
    diskSizeGb: number,
    author: string,
    description: string
  ) {
    const instancesClient = new InstancesClient({
      credentials,
    });
    const defaultInsertResource: protos.google.cloud.compute.v1.IInsertInstanceRequest =
      {
        instanceResource: {
          name: instanceName,
          canIpForward: true,
          deletionProtection: false,
          description,
          disks: [
            {
              autoDelete: true,
              boot: true,
              initializeParams: {
                diskSizeGb: diskSizeGb,
                labels: {},
              },
            },
          ],
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
              { key: "managers", value: author },
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
          sourceMachineImage: `projects/${defaultConfig.projectId}/global/machineImages/${sourceImage}`,
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
    console.log("Create complete");

    let operation: any = response.latestResponse;

    const operationsClient = new ZoneOperationsClient({ credentials });
    // Wait for the create operation to complete.
    while (operation.status !== "DONE") {
      console.log("Wating operation done");

      [operation] = await operationsClient.wait({
        operation: operation.name,
        project: defaultConfig.projectId,
        zone: operation.zone.split("/").pop(),
      });
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
  // Hàm khởi động một instance
  startInstance: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({ credentials });
    try {
      console.log(`Starting instance ${instanceName} in zone ${zone}...`);
      const [response] = await instancesClient.start({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });
      console.log(`Instance ${instanceName} started.`);
      return response;
    } catch (err) {
      console.error(`Error starting instance ${instanceName}: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },

  // Hàm tiếp tục chạy một instance
  resumeInstance: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({ credentials });
    try {
      console.log(`Resuming instance ${instanceName} in zone ${zone}...`);
      const [response] = await instancesClient.resume({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });
      console.log(`Instance ${instanceName} resumed.`);
      return response;
    } catch (err) {
      console.error(`Error resuming instance ${instanceName}: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },

  // Hàm dừng một instance
  stopInstance: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({ credentials });
    try {
      console.log(`Stopping instance ${instanceName} in zone ${zone}...`);
      const [response] = await instancesClient.stop({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });
      console.log(`Instance ${instanceName} stopped.`);
      return response;
    } catch (err) {
      console.error(`Error stopping instance ${instanceName}: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },

  // Hàm tạm ngừng một instance
  suspendInstance: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({ credentials });
    try {
      console.log(`Suspending instance ${instanceName} in zone ${zone}...`);
      const [response] = await instancesClient.suspend({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });
      console.log(`Instance ${instanceName} suspended.`);
      return response;
    } catch (err) {
      console.error(`Error suspending instance ${instanceName}: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },

  // Hàm khởi động lại một instance
  resetInstance: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({ credentials });
    try {
      console.log(`Resetting instance ${instanceName} in zone ${zone}...`);
      const [response] = await instancesClient.reset({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });
      console.log(`Instance ${instanceName} reset.`);
      return response;
    } catch (err) {
      console.error(`Error resetting instance ${instanceName}: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },

  // Hàm xóa một instance
  deleteInstance: async function (zone: string, instanceName: string) {
    const instancesClient = new InstancesClient({ credentials });
    try {
      console.log(`Deleting instance ${instanceName} in zone ${zone}...`);
      const [response] = await instancesClient.delete({
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
      });
      console.log(`Instance ${instanceName} deleted.`);
      return response;
    } catch (err) {
      console.error(`Error deleting instance ${instanceName}: ${err}`);
      throw err;
    } finally {
      instancesClient.close();
    }
  },
};
export default gc;
