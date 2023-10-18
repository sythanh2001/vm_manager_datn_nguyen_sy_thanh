// Need clean

import {
  InstancesClient,
  MachineImagesClient,
  MachineTypesClient,
  RegionsClient,
  ZoneOperationsClient,
  ZonesClient,
  DisksClient,
  protos,
} from "@google-cloud/compute";
import { google } from "@google-cloud/compute/build/protos/protos";
import axios from "axios";
import { JWT } from "google-auth-library";

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
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID as string,
};

const getAccessToken = async () => {
  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const url = `https://dns.googleapis.com/dns/v1/projects/${defaultConfig.projectId}`;
  const res = await client.request({ url });

  return client.credentials.access_token;
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

const resizeInstanceDisk = async function (
  zone: string,
  diskName: string,
  newDiskSizeGb: number
) {
  console.log("🚀 ~ file: gCompute.ts:106 ~ newDiskSizeGb:", newDiskSizeGb);
  const token = await getAccessToken();
  console.log("🚀 ~ file: gCompute.ts:125 ~ token:", token);
  try {
    // Get information about the existing disk
    const response = await axios.get(
      `https://compute.googleapis.com/compute/v1/projects/${defaultConfig.projectId}/zones/${zone}/disks/${diskName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const disk = response.data;
    console.log("🚀 ~ file: gCompute.ts:118 ~ disk:", disk);
    if (!disk) {
      return { error: `Disk ${diskName} not found.` };
    }

    // Create a request to resize the disk
    const resizeRequest = {
      sizeGb: newDiskSizeGb,
    };
    console.log("🚀 ~ file: gCompute.ts:130 ~ resizeRequest:", resizeRequest);

    // Resize the disk
    console.log(`Resizing disk ${diskName} to ${newDiskSizeGb} GB...`);
    const resizeResponse = await axios.post(
      `https://compute.googleapis.com/compute/v1/projects/${defaultConfig.projectId}/zones/${zone}/disks/${diskName}/resize`,
      resizeRequest,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(`Disk ${diskName} resized.`);
    return resizeResponse.data;
  } catch (err) {
    console.error(`Error increasing disk size for ${diskName}: ${err}`);
    throw err;
  }
};
const changeInstanceMachineType = async function (
  zone: string,
  instanceName: string,
  newMachineType: string
) {
  const instancesClient = new InstancesClient({
    credentials,
  });

  try {
    // Lấy thông tin instance hiện tại
    const [instance] = await instancesClient.get({
      project: defaultConfig.projectId,
      zone: zone,
      instance: instanceName,
    });

    if (!instance) {
      throw new Error(`Instance ${instanceName} not found.`);
    }

    // Tạo một request để cập nhật loại máy ảo của instance
    const updateRequest: protos.google.cloud.compute.v1.SetMachineTypeInstanceRequest =
      {
        project: defaultConfig.projectId,
        zone: zone,
        instance: instanceName,
        instancesSetMachineTypeRequestResource: {
          machineType: `zones/${zone}/machineTypes/${newMachineType}`,
        },
        toJSON: function (): { [k: string]: any } {
          throw new Error("Function not implemented.");
        },
      };

    // Gửi yêu cầu cập nhật loại máy ảo của instance
    console.log(
      `Changing machine type of instance ${instanceName} to ${newMachineType}...`
    );
    const [response] = await instancesClient.setMachineType(updateRequest);
    console.log(
      `Machine type of instance ${instanceName} changed to ${newMachineType}.`
    );

    return response;
  } catch (err) {
    console.error(
      `Error changing machine type for instance ${instanceName}: ${err}`
    );
    throw err;
  } finally {
    instancesClient.close();
  }
};

const gc = {
  getRegions,
  getZones,
  getMachineTypes,
  getMachineImageList,
  resizeInstanceDisk,
  changeInstanceMachineType,
  createInstance: async function (
    instanceName: string,
    zone: string,
    machineType: string,
    sourceImage: string,
    diskSizeGb: number,
    author: string,
    subDomain: string,
    description: string
  ) {
    const instancesClient = new InstancesClient({
      credentials,
    });

    //METADATA
    const metadataItems: protos.google.cloud.compute.v1.IItems[] = [];
    metadataItems.push({ key: "managers", value: author });
    if (subDomain) {
      metadataItems.push({
        key: "domain",
        value: `${subDomain}.${process.env.BASE_DOMAIN}`,
      });
    }

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
          machineType: `zones/${zone}/machineTypes/${machineType}`,
          metadata: {
            items: metadataItems,
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

    console.log(`Creating the ${instanceName} instance in ${zone}...`);
    const [response] = await instancesClient.insert(defaultInsertResource);
    console.log("Create complete");

    let operation: any = response.latestResponse;

    const operationsClient = new ZoneOperationsClient({ credentials });
    // Wait for the create operation to complete.
    while (operation.status !== "DONE") {
      console.log("🚀 ~ file: gCompute.ts:288 ~ operation:", operation);
      try {
        console.log("Wating operation done");

        [operation] = await operationsClient.wait({
          operation: operation.name,
          project: defaultConfig.projectId,
          zone: operation.zone.split("/").pop(),
        });
      } catch (error) {
        console.log("🚀 ~ file: gCompute.ts:297 ~ error:", error);
      }
    }
    try {
      await gc.resizeInstanceDisk(zone, instanceName, diskSizeGb);
      console.log("resize disk complete");
    } catch (error) {
      console.log("🚀 ~ file: gCompute.ts:322 ~ error:", error);
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

    const arr: protos.google.cloud.compute.v1.IInstance[] = [];
    const promises = [];

    for await (const [zone, instancesObject] of aggListRequest) {
      const instances = instancesObject.instances;
      if (instances && instances.length > 0) {
        promises.push(
          Promise.all(
            instances.map(
              async (i: protos.google.cloud.compute.v1.IInstance) => {
                arr.push(i);
              }
            )
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
  containsEmail: function (
    instance: google.cloud.compute.v1.IInstance,
    targetEmail: string
  ) {
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
    const allInstances = (await this.listAllInstances()) as any[];
    const filteredInstances = allInstances.filter((instance) => {
      if (instance && instance.metadata && instance.metadata.items) {
        const hasMatchingMetadata = metadataKeys.some((key) =>
          instance.metadata.items?.some((item: any) => item.key === key)
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
