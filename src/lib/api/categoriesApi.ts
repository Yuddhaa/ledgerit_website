import type { category } from "$lib/utils/types"
import api from "./api"

export default {
    listAll: (businessId: string, customFetch?: typeof fetch) => api.Get<{ categories: category[] }>(`/business/${businessId}/categories/`, customFetch),
}
