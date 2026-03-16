import partiesApi from "$lib/api/partiesApi";
import transactionsApi from "$lib/api/transactionsApi";
import { partiesStore, transactionStore } from "$lib/stores/store.svelte";
import { getCategoryPromise, getPartyPromise } from "$lib/utils/helpers";
import type { transaction, tranStats } from "$lib/utils/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, parent, fetch }) => {
    await parent();
    const businessId = params.id;

    // 1. Check if we have cached data for THIS business
    const hasCache = transactionStore.businessId === businessId &&
        transactionStore.transactions.transactions.length > 0;

    let transactionsPromise: Promise<{
        stats: tranStats;
        transactions: transaction[];
    }>;

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

    return {
        transactionsPromise,
        partyPromise: getPartyPromise(businessId, fetch),
        categoryPromise: getCategoryPromise(businessId, fetch),
    };
};
