import type { member } from "$lib/stores/store.svelte";
import type { business } from "$lib/utils/types";
import api from "./api";

export default {
    create: (name: string, customFetch?: typeof fetch) => api.Post<{ business: business }>('/business/', { name }, customFetch),

    listAll: (customFetch?: typeof fetch) => api.Get<{ business: business[] }>("/business/", customFetch),

    listOne: (businessId: string, customFetch?: typeof fetch) => api.Get<{ business: business }>(`/business/${businessId}`, customFetch),

    listMembers: (businessId: string, customFetch?: typeof fetch) => api.Get<{ members: member[] }>(`/business/${businessId}/members`, customFetch),

    patchName: (businessId: string, name: string, customFetch?: typeof fetch) =>
        api.Patch<{ name: string }>(`/business/${businessId}/`, { name }, customFetch),

    addMember: (businessId: string, params: { user_id: string; role: "admin" | "employee" }, customFetch?: typeof fetch) =>
        api.Post(`/business/${businessId}/members`, params, customFetch),

    updateRole: (businessId: string, params: { user_id: string; role: "admin" | "employee" }, customFetch?: typeof fetch) =>
        api.Patch(`/business/${businessId}/members`, params, customFetch),

    delMember: (businessId: string, memberId: string, customFetch?: typeof fetch) =>
        api.Delete(`/business/${businessId}/members/${memberId}`, null, customFetch),

    delBusiness: (businessId: string, customFetch?: typeof fetch) =>
        api.Delete(`/business/${businessId}`, null, customFetch),
}
