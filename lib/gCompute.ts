import {
  InstancesClient,
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
  zone: "asia-east1-b",
  instanceName: "test-sythanh",
  machineType: "e2-micro",
  // sourceImage: "projects/debian-cloud/global/images/family/debian-10",
  sourceImage: "projects/f2app-154608/global/machineImages/code-sep-minoring",
  networkName: "global/networks/default",
  diskSizeGb: 30,
};

const gc = {
  createInstance: async function (
    instanceName: string,
    zone: string = defaultConfig.zone,
    diskSizeGb: number = defaultConfig.diskSizeGb
  ) {
    const instancesClient = new InstancesClient({
      credentials,
    });
    const defaultInsertResource: protos.google.cloud.compute.v1.IInsertInstanceRequest =
      {
        instanceResource: {
          name: instanceName,
          disks: [
            {
              // Describe the size and source image of the boot disk to attach to the instance.
              initializeParams: {
                diskSizeGb,
                sourceImage: defaultConfig.sourceImage,
              },
              autoDelete: true,
              boot: true,
              type: "PERSISTENT",
            },
          ],
          machineType: `zones/${defaultConfig.zone}/machineTypes/${defaultConfig.machineType}`,
          networkInterfaces: [
            {
              // Use the network interface provided in the networkName argument.
              name: defaultConfig.networkName,
              accessConfigs: [
                {
                  name: "external-nat",
                  type: "ONE_TO_ONE_NAT", // This type assigns an external IP address.
                },
              ],
            },
          ],
        },
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        zone: zone,
      };
    console.log(
      `Creating the ${defaultConfig.instanceName} instance in ${defaultConfig.zone}...`
    );
    const [response] = await instancesClient.insert(defaultInsertResource);
    console.log(
      "🚀 ~ file: gCompute.ts:43 ~ createInstance ~ response:",
      response
    );

    let operation: any = response.latestResponse;

    const operationsClient = new ZoneOperationsClient({ credentials });
    // Wait for the create operation to complete.
    while (operation.status !== "DONE") {
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
};
export default gc;
