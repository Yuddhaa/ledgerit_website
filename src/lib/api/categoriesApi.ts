import type { category } from "$lib/utils/types"
import api from "./api"

export default {
    listAll: (businessId: string, customFetch?: typeof fetch) => api.Get<{ categories: category[] }>(`/business/${businessId}/categories/`, customFetch),

    create: (businessId: string, params: { name: string }, customFetch?: typeof fetch) =>
        api.Post<{ category: category }>(`/business/${businessId}/categories/`, params, customFetch),

    update: (businessId: string, categoryId: string, params: { name: string }, customFetch?: typeof fetch) =>
        api.Put<{ category: category }>(`/business/${businessId}/categories/${categoryId}`, params, customFetch),

    delete: (businessId: string, categoryId: string, customFetch?: typeof fetch) =>
        api.Delete(`/business/${businessId}/categories/${categoryId}`, null, customFetch),

}


