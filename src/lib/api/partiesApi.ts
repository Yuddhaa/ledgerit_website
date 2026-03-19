import type { party } from "$lib/utils/types";
import api from "./api";

export default {
    listAll: (businessId: string, params: { place?: string } = {}, customFetch?: typeof fetch) => {
        // Create a search params object from the filters
        const query = new URLSearchParams();

        // Only append parameters that actually have a value
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                query.append(key, value);
            }
        });

        const queryString = query.toString();
        const url = `/business/${businessId}/parties${queryString ? `?${queryString}` : ''}`;

        return api.Get<{ parties: party[] }>(url, customFetch);
    },

    listPlaces: (businessId: string, customFetch?: typeof fetch) => api.Get<{ places: string[] }>(`/business/${businessId}/parties/places`, customFetch),

    create: (businessId: string, params: { name: string, place: string, phone_number?: string }, customFetch?: typeof fetch) =>
        api.Post<{ party: party }>(`/business/${businessId}/parties/`, params, customFetch),

    update: (businessId: string, partyId: string, params: { name: string, place: string, phone_number?: string }, customFetch?: typeof fetch) =>
        api.Put<{ party: party }>(`/business/${businessId}/parties/${partyId}`, params, customFetch),

    delete: (businessId: string, partyId: string, customFetch?: typeof fetch) =>
        api.Delete(`/business/${businessId}/parties/${partyId}`, null, customFetch),

}
