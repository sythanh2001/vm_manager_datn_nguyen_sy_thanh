import axios, { AxiosResponse } from "axios";

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
