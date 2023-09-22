import cf from "@/lib/cloudflare";
import gc from "@/lib/gCompute";

import { NextResponse } from "next/server";

// export async function GET(request: Request) {
//   return NextResponse.json(await gc.createInstance("test2"));
// }
const t = {
  resourcePolicies: [],
  networkInterfaces: [
    {
      accessConfigs: [
        {
          kind: "compute#accessConfig",
          _kind: "kind",
          name: "external-nat",
          _name: "name",
          type: "ONE_TO_ONE_NAT",
          _type: "type",
          natIP: "104.199.193.227",
          _natIP: "natIP",
          networkTier: "PREMIUM",
          _networkTier: "networkTier",
        },
      ],
      aliasIpRanges: [],
      ipv6AccessConfigs: [],
      kind: "compute#networkInterface",
      _kind: "kind",
      name: "nic0",
      _name: "name",
      networkIP: "10.140.0.12",
      _networkIP: "networkIP",
      network:
        "https://www.googleapis.com/compute/v1/projects/datnnguyensythanh-399701/global/networks/default",
      _network: "network",
      fingerprint: "7ksIp2yx-LA=",
      _fingerprint: "fingerprint",
      subnetwork:
        "https://www.googleapis.com/compute/v1/projects/datnnguyensythanh-399701/regions/asia-east1/subnetworks/default",
      _subnetwork: "subnetwork",
      stackType: "IPV4_ONLY",
      _stackType: "stackType",
    },
  ],
  disks: [
    {
      guestOsFeatures: [
        {
          type: "UEFI_COMPATIBLE",
          _type: "type",
        },
        {
          type: "VIRTIO_SCSI_MULTIQUEUE",
          _type: "type",
        },
      ],
      licenses: [
        "https://www.googleapis.com/compute/v1/projects/debian-cloud/global/licenses/debian-10-buster",
      ],
      boot: true,
      _boot: "boot",
      kind: "compute#attachedDisk",
      _kind: "kind",
      mode: "READ_WRITE",
      _mode: "mode",
      type: "PERSISTENT",
      _type: "type",
      deviceName: "persistent-disk-0",
      _deviceName: "deviceName",
      index: 0,
      _index: "index",
      source:
        "https://www.googleapis.com/compute/v1/projects/datnnguyensythanh-399701/zones/asia-east1-b/disks/test5",
      _source: "source",
      architecture: "X86_64",
      _architecture: "architecture",
      diskSizeGb: "10",
      _diskSizeGb: "diskSizeGb",
      autoDelete: true,
      _autoDelete: "autoDelete",
      interface: "SCSI",
      _interface: "interface",
    },
  ],
  serviceAccounts: [],
  guestAccelerators: [],
  labels: {},
  id: "5806149008214757810",
  _id: "id",
  kind: "compute#instance",
  _kind: "kind",
  name: "test5",
  _name: "name",
  tags: {
    items: [],
    fingerprint: "42WmSpB8rSM=",
    _fingerprint: "fingerprint",
  },
  _tags: "tags",
  zone: "https://www.googleapis.com/compute/v1/projects/datnnguyensythanh-399701/zones/asia-east1-b",
  _zone: "zone",
  shieldedInstanceConfig: {
    enableSecureBoot: false,
    _enableSecureBoot: "enableSecureBoot",
    enableVtpm: true,
    _enableVtpm: "enableVtpm",
    enableIntegrityMonitoring: true,
    _enableIntegrityMonitoring: "enableIntegrityMonitoring",
  },
  _shieldedInstanceConfig: "shieldedInstanceConfig",
  creationTimestamp: "2023-09-21T23:08:30.320-07:00",
  _creationTimestamp: "creationTimestamp",
  metadata: {
    items: [],
    kind: "compute#metadata",
    _kind: "kind",
    fingerprint: "C6YCx4I5cSE=",
    _fingerprint: "fingerprint",
  },
  _metadata: "metadata",
  startRestricted: false,
  _startRestricted: "startRestricted",
  shieldedInstanceIntegrityPolicy: {
    updateAutoLearnPolicy: true,
    _updateAutoLearnPolicy: "updateAutoLearnPolicy",
  },
  _shieldedInstanceIntegrityPolicy: "shieldedInstanceIntegrityPolicy",
  labelFingerprint: "42WmSpB8rSM=",
  _labelFingerprint: "labelFingerprint",
  status: "RUNNING",
  _status: "status",
  machineType:
    "https://www.googleapis.com/compute/v1/projects/datnnguyensythanh-399701/zones/asia-east1-b/machineTypes/e2-micro",
  _machineType: "machineType",
  fingerprint: "3qLPaRC0OpM=",
  _fingerprint: "fingerprint",
  scheduling: {
    nodeAffinities: [],
    provisioningModel: "STANDARD",
    _provisioningModel: "provisioningModel",
    onHostMaintenance: "MIGRATE",
    _onHostMaintenance: "onHostMaintenance",
    preemptible: false,
    _preemptible: "preemptible",
    automaticRestart: true,
    _automaticRestart: "automaticRestart",
  },
  _scheduling: "scheduling",
  cpuPlatform: "Intel Broadwell",
  _cpuPlatform: "cpuPlatform",
  lastStartTimestamp: "2023-09-21T23:08:35.695-07:00",
  _lastStartTimestamp: "lastStartTimestamp",
  selfLink:
    "https://www.googleapis.com/compute/v1/projects/datnnguyensythanh-399701/zones/asia-east1-b/instances/test5",
  _selfLink: "selfLink",
  deletionProtection: false,
  _deletionProtection: "deletionProtection",
};

type CreateInstanceData = {
  instanceName: string;
};

export async function POST(req: Request) {
  const data: CreateInstanceData = await req.json();
  console.log("🚀 ~ file: route.ts:15 ~ POST ~ data:", data);
  const { instanceName } = data;
  if (!instanceName) {
    return NextResponse.json({ error: "Missing field!" });
  }
  const createInstanceRes = await gc.createInstance(instanceName);
  const instanceNATIP = createInstanceRes.networkInterfaces
    ?.at(0)
    ?.accessConfigs?.at(0)?.natIP;
  if (!instanceNATIP) {
    return NextResponse.json({ error: "Missing external ip!" });
  }
  await cf.dnsRecords.add(process.env.CLOUDFLARE_ZONE_ID as string, {
    type: "A",
    name: instanceName,
    content: instanceNATIP,
    ttl: 1,
    proxied: false,
  });
  return NextResponse.json(createInstanceRes);
}
