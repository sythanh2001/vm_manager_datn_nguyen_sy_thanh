export interface InstanceInfo {
  resourcePolicies?: any[];
  networkInterfaces?: NetworkInterface[];
  disks?: Disk[];
  serviceAccounts?: ServiceAccount[];
  guestAccelerators?: GuestAccelerator[];
  labels?: Labels;
  id?: string;
  _id?: string;
  kind?: string;
  _kind?: string;
  name?: string;
  _name?: string;
  tags?: Tags;
  _tags?: string;
  zone?: string;
  _zone?: string;
  shieldedInstanceConfig?: ShieldedInstanceConfig;
  _shieldedInstanceConfig?: string;
  creationTimestamp?: Date;
  _creationTimestamp?: string;
  metadata?: Metadata;
  _metadata?: string;
  startRestricted?: boolean;
  _startRestricted?: string;
  reservationAffinity?: ReservationAffinity;
  _reservationAffinity?: string;
  shieldedInstanceIntegrityPolicy?: ShieldedInstanceIntegrityPolicy;
  _shieldedInstanceIntegrityPolicy?: string;
  labelFingerprint?: string;
  _labelFingerprint?: string;
  status?: string;
  _status?: string;
  machineType?: string;
  _machineType?: string;
  fingerprint?: string;
  _fingerprint?: string;
  displayDevice?: DisplayDevice;
  _displayDevice?: string;
  scheduling?: Scheduling;
  _scheduling?: string;
  cpuPlatform?: string;
  _cpuPlatform?: string;
  lastStopTimestamp?: Date;
  _lastStopTimestamp?: string;
  description?: string;
  _description?: string;
  lastStartTimestamp?: Date;
  _lastStartTimestamp?: string;
  selfLink?: string;
  _selfLink?: string;
  deletionProtection?: boolean;
  _deletionProtection?: string;
  canIpForward?: boolean;
  _canIpForward?: string;
  confidentialInstanceConfig?: ConfidentialInstanceConfig;
  _confidentialInstanceConfig?: string;
  zoneName?: string;
  keyRevocationActionType?: string;
  _keyRevocationActionType?: string;
}

export interface ConfidentialInstanceConfig {
  enableConfidentialCompute?: boolean;
  _enableConfidentialCompute?: string;
}

export interface Disk {
  guestOsFeatures?: GuestOSFeature[];
  licenses?: string[];
  boot?: boolean;
  _boot?: string;
  kind?: string;
  _kind?: string;
  mode?: string;
  _mode?: string;
  type?: string;
  _type?: Type;
  deviceName?: string;
  _deviceName?: string;
  index?: number;
  _index?: string;
  source?: string;
  _source?: string;
  diskSizeGb?: string;
  _diskSizeGb?: string;
  autoDelete?: boolean;
  _autoDelete?: string;
  interface?: string;
  _interface?: string;
  savedState?: string;
  _savedState?: string;
  shieldedInstanceInitialState?: {
    [key: string]: ShieldedInstanceInitialState[];
  };
  _shieldedInstanceInitialState?: string;
  architecture?: string;
  _architecture?: string;
}

export enum Type {
  Type = "type",
}

export interface GuestOSFeature {
  type?: string;
  _type?: Type;
}

export interface ShieldedInstanceInitialState {
  fileType?: string;
  _fileType?: string;
  content?: string;
  _content?: string;
}

export interface DisplayDevice {
  enableDisplay?: boolean;
  _enableDisplay?: string;
}

export interface GuestAccelerator {
  acceleratorType?: string;
  _acceleratorType?: string;
  acceleratorCount?: number;
  _acceleratorCount?: string;
}

export interface Labels {}

export interface Metadata {
  items?: Item[];
  kind?: string;
  _kind?: string;
  fingerprint?: string;
  _fingerprint?: string;
}

export interface Item {
  key?: string;
  _key?: string;
  value?: string;
  _value?: string;
}

export interface NetworkInterface {
  accessConfigs?: AccessConfig[];
  aliasIpRanges?: any[];
  ipv6AccessConfigs?: any[];
  kind?: string;
  _kind?: string;
  name?: string;
  _name?: string;
  networkIP?: string;
  _networkIP?: string;
  network?: string;
  _network?: string;
  fingerprint?: string;
  _fingerprint?: string;
  subnetwork?: string;
  _subnetwork?: string;
  stackType?: string;
  _stackType?: string;
}

export interface AccessConfig {
  kind?: string;
  _kind?: string;
  name?: string;
  _name?: string;
  type?: string;
  _type?: Type;
  natIP?: string;
  _natIP?: string;
  networkTier?: string;
  _networkTier?: string;
}

export interface ReservationAffinity {
  values?: any[];
  consumeReservationType?: string;
  _consumeReservationType?: string;
}

export interface Scheduling {
  nodeAffinities?: any[];
  provisioningModel?: string;
  _provisioningModel?: string;
  onHostMaintenance?: string;
  _onHostMaintenance?: string;
  preemptible?: boolean;
  _preemptible?: string;
  automaticRestart?: boolean;
  _automaticRestart?: string;
}

export interface ServiceAccount {
  scopes?: string[];
  email?: string;
  _email?: string;
}

export interface ShieldedInstanceConfig {
  enableSecureBoot?: boolean;
  _enableSecureBoot?: string;
  enableVtpm?: boolean;
  _enableVtpm?: string;
  enableIntegrityMonitoring?: boolean;
  _enableIntegrityMonitoring?: string;
}

export interface ShieldedInstanceIntegrityPolicy {
  updateAutoLearnPolicy?: boolean;
  _updateAutoLearnPolicy?: string;
}

export interface Tags {
  items?: any[];
  fingerprint?: string;
  _fingerprint?: string;
}
