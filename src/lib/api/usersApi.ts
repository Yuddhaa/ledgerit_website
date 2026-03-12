import type { user } from "$lib/utils/types";
import api from "./api";

export default {
    update: (name: string, phone_number: string, customFetch?: typeof fetch) => api.Put<{ user: user }>('/users/me', { name, phone_number }, customFetch)
}
