import type { member } from "$lib/stores/store.svelte";
import type { business } from "$lib/utils/types";
import api from "./api";

export default {
    create: (name: string, customFetch?: typeof fetch) => api.Post<{ business: business }>('/business/', { name }, customFetch),

    listAll: (customFetch?: typeof fetch) => api.Get<{ business: business[] }>("/business/", customFetch),

    listOne: (businessId: string, customFetch?: typeof fetch) => api.Get<{ business: business }>(`/business/${businessId}`, customFetch),

    listMembers: (businessId: string, customFetch?: typeof fetch) => api.Get<{ members: member[] }>(`/business/${businessId}/members`, customFetch),
}
