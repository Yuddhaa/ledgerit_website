import type { business } from "$lib/utils/types";
import api from "./api";

export default {
    create: (name: string, customFetch?: typeof fetch) => api.Post<any>('/business/', { name }, customFetch),

    listAll: (customFetch?: typeof fetch) => api.Get<{ business: business[] }>("/business/", customFetch),

    listOne: (businessId: string, customFetch?: typeof fetch) => api.Get<{ business: business }>(`/business/${businessId}`, customFetch)

}
