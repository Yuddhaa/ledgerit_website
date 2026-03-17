import type { user } from "$lib/utils/types";
import api from "./api";

export default {
    listMe: (customFetch?: typeof fetch) => api.Get<{ user: user }>('/users/me', customFetch),

    update: (name: string, phone_number: string, customFetch?: typeof fetch) => api.Put<{ user: user }>('/users/me', { name, phone_number }, customFetch),

    listByPhNo: (phNo: string, customFetch?: typeof fetch) => api.Get<{ user: user }>(`/users/phone/${phNo}`, customFetch),
}
