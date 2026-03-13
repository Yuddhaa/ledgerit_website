import api from "$lib/api/api";
import type { Transaction, tranStats } from "$lib/utils/types";

export default {
    /**
     * listAll fetches transactions for a business with optional filtering
     */
    listAll: (
        businessId: string,
        params: {
            user_id?: string;
            category_id?: string;
            party_id?: string;
            mode?: string;
            direction?: string;
            sortBy?: string;
            order?: string;
            from?: string;
            to?: string;
        } = {},
        customFetch?: typeof fetch
    ) => {
        // Create a search params object from the filters
        const query = new URLSearchParams();

        // Only append parameters that actually have a value
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== "") {
                query.append(key, value);
            }
        });

        const queryString = query.toString();
        const url = `/business/${businessId}/transactions${queryString ? `?${queryString}` : ''}`;

        return api.Get<{ stats: tranStats, transactions: Transaction[] }>(url, customFetch);
    }
}
