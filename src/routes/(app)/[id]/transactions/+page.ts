import partiesApi from "$lib/api/partiesApi";
import transactionsApi from "$lib/api/transactionsApi";
import { transactionStore } from "$lib/stores/store.svelte";
import { log } from "$lib/utils/helpers";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, parent, fetch }) => {
    await parent();
    const businessId = params.id;

    // 1. Check if we have cached data for THIS business
    const hasCache = transactionStore.businessId === businessId &&
        transactionStore.transactions.transactions.length > 0;

    let transactionsPromise;

    if (hasCache) {
        // Return cached data as a resolved promise
        transactionsPromise = Promise.resolve(transactionStore.transactions);
    } else {
        // Update store's businessId and fetch fresh data
        transactionStore.businessId = businessId;
        transactionsPromise = transactionsApi.listAll(businessId, transactionStore.filter, fetch)
            .then((res) => {
                transactionStore.transactions = {
                    stats: res.stats,
                    transactions: res.transactions ? res.transactions : []
                };
                return res;
            });
    }

    // Always refresh parties in background or check cache
    if (transactionStore.parties.length === 0 || transactionStore.businessId !== businessId) {
        partiesApi.listAll(businessId, {}, fetch).then((res) => {
            transactionStore.parties = res.parties;
        });
    }

    return {
        businessId,
        transactionsPromise
    };
};
