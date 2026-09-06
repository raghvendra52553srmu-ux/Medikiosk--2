import { api } from "@/services/apiClient";

/**
 * Operations data. Every figure is a real aggregate query — the prototype
 * dashboard mapped a hardcoded staff array and printed their passwords on
 * screen. No endpoint here can return a credential.
 */

export const getAdminOverview = () => api.get("/admin/overview");
export const getStaffDirectory = () => api.get("/admin/staff");

export const getAuditLog = (page = 1, pageSize = 20, entity) =>
  api.get(
    `/admin/audit?page=${page}&pageSize=${pageSize}${entity ? `&entity=${encodeURIComponent(entity)}` : ""}`
);
