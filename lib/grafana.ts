import axios, { AxiosResponse } from "axios";
export type AlertRule = {
  id: number;
  uid: string;
  orgID: number;
  folderUID: string;
  ruleGroup: string;
  title: string;
  condition: string;
  data: Datum[];
  updated: Date;
  noDataState: string;
  execErrState: string;
  for: string;
  annotations: Annotations;
  isPaused: boolean;
};

export type Annotations = {
  __dashboardUid__: string;
  __panelId__: string;
  description: string;
  summary: string;
};

export type Datum = {
  refId: string;
  queryType: string;
  relativeTimeRange: RelativeTimeRange;
  datasourceUid: string;
  model: Model;
};

export type Model = {
  editorMode?: string;
  expr?: string;
  instant?: boolean;
  intervalMs: number;
  legendFormat?: string;
  maxDataPoints: number;
  range?: boolean;
  refId: string;
  conditions?: Condition[];
  datasource?: Datasource;
  expression?: string;
  reducer?: string;
  type?: string;
};

export type Condition = {
  evaluator: Evaluator;
  operator: Operator;
  query: Query;
  reducer: Evaluator;
  type: string;
};

export type Evaluator = {
  params: number[];
  type: string;
};

export type Operator = {
  type: string;
};

export type Query = {
  params: string[];
};

export type Datasource = {
  type: string;
  uid: string;
};

export type RelativeTimeRange = {
  from: number;
  to: number;
};

export interface Contact {
  uid: string;
  name: string;
  type: string;
  settings: Settings;
  disableResolveMessage: boolean;
}

export interface Settings {
  addresses: string;
  singleEmail: boolean;
}

const BASE_URL = `http://${process.env.BASE_DOMAIN}`; // Thay thế bằng URL cụ thể của API của bạn

const axiosAPI = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.GRAFANA_TOKEN}`,
  },
});

const grafana = {
  changeBaseURL(newBaseURL: string) {
    axiosAPI.defaults.baseURL = `http://${newBaseURL}:3001`;
  },

  deleteAlertRule(uid: string): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules/${uid}`;
    return axiosAPI.delete(url);
  },

  getAlertRule(uid: string): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules/${uid}`;
    return axiosAPI.get(url);
  },

  getAlertRuleExport(uid: string): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules/${uid}/export`;
    return axiosAPI.get(url);
  },

  getAlertRuleGroup(folderUid: string, group: string): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/folder/${folderUid}/rule-groups/${group}`;
    return axiosAPI.get(url);
  },

  getAlertRuleGroupExport(
    folderUid: string,
    group: string
  ): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/folder/${folderUid}/rule-groups/${group}/export`;
    return axiosAPI.get(url);
  },

  getAllAlertRules(): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules`;
    return axiosAPI.get(url);
  },

  getAllAlertRulesExport(): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules/export`;
    return axiosAPI.get(url);
  },

  createAlertRule(data: any): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules`;
    return axiosAPI.post(url, data);
  },

  updateAlertRule(uid: string, data: any): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/alert-rules/${uid}`;
    return axiosAPI.put(url, data);
  },

  updateAlertRuleGroupInterval(
    folderUid: string,
    group: string,
    data: any
  ): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/folder/${folderUid}/rule-groups/${group}`;
    return axiosAPI.put(url, data);
  },

  deleteContactPoint(uid: string): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/contact-points/${uid}`;
    return axiosAPI.delete(url);
  },

  getAllContactPoints(): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/contact-points`;
    return axiosAPI.get(url);
  },

  getAllContactPointsExport(): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/contact-points/export`;
    return axiosAPI.get<Contact[]>(url);
  },

  createContactPoint(data: any): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/contact-points`;
    return axiosAPI.post(url, data);
  },

  updateContactPoint(uid: string, data: any): Promise<AxiosResponse> {
    const url = `/api/v1/provisioning/contact-points/${uid}`;
    return axiosAPI.put(url, data);
  },
};
export default grafana;
