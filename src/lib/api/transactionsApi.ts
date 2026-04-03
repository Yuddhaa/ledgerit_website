import api from "$lib/api/api";
import { log } from "$lib/utils/helpers";
import type { approval, approvalStatus, approvalType, minTran, transaction, tranStats } from "$lib/utils/types";

export default {
    listone: (businessId: string, tranId: string, customFetch?: typeof fetch) =>
        api.Get<{ transaction: transaction }>(`/business/${businessId}/transactions/${tranId}`, customFetch),
    /**
     * listAll fetches transactions for a business with optional filtering
     */
    listAll: (
        businessId: string,
        params: {
            user_id?: string[];
            category_id?: string[];
            party_id?: string[];
            mode?: string[];
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
            if (value === undefined || value === "") return;

            if (Array.isArray(value)) {
                value.forEach(v => {
                    if (v) query.append(key, v);
                });
            } else {
                query.append(key, value);
            }
        });

        const queryString = query.toString();
        const url = `/business/${businessId}/transactions${queryString ? `?${queryString}` : ''}`;

        return api.Get<{ stats: tranStats, transactions: transaction[] }>(url, customFetch);
    },

    listApprovals: (
        businessId: string,
        params: {
            requested_by?: string[];
            status?: approvalStatus;
            type?: approvalType;
            from?: string;
            to?: string;
        } = {},
        customFetch?: typeof fetch
    ) => {
        // Create a search params object from the filters
        const query = new URLSearchParams();

        // Only append parameters that actually have a value
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === "") return;

            if (Array.isArray(value)) {
                value.forEach(v => {
                    if (v) query.append(key, v);
                });
            } else {
                query.append(key, value);
            }
        });

        const queryString = query.toString();
        const url = `/business/${businessId}/transactions/approvals${queryString ? `?${queryString}` : ''}`;

        log(`inside listApprovals:${url}`)

        return api.Get<{ requests: approval[] }>(url, customFetch);
    },

    patchApproval: (businessId: string, approvalId: string, tran: approvalTran, customFetch?: typeof fetch) =>
        api.Patch(`/business/${businessId}/transactions/approvals/${approvalId}`, tran, customFetch),

    create: (businessId: string, params: minTran, customFetch?: typeof fetch) =>
        api.Post<{}>(`/business/${businessId}/transactions`, params, customFetch),

    update: (businessId: string, tranId: string, params: minTran & { reason: string }, customFetch?: typeof fetch) =>
        api.Patch<({ requestId: string } | { transactions: object })>(`/business/${businessId}/transactions/${tranId}`, params, customFetch),


    delete: (businessId: string, tranId: string, customFetch?: typeof fetch) =>
        api.Delete(`/business/${businessId}/transactions/${tranId}`, null, customFetch),
}

export interface approvalTran {
    amount: string
    direction: "in" | "out"
    category_id: string | null
    category_name: string | null
    party_id: string
    party_name: string
    mode: "online" | "cash" | "cheque"
    receipt_no: string
    description: string
    reason: string,
    status: approvalStatus,
}
