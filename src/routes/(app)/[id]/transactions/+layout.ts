import businessApi from "$lib/api/businessApi";
import partiesApi from "$lib/api/partiesApi";
import transactionsApi from "$lib/api/transactionsApi";
import { memberStore, transactionStore, type member } from "$lib/stores/store.svelte";
import { getCategoryPromise, getPartyPlacesPromise, getPartyPromise, log } from "$lib/utils/helpers";
import type { transaction, tranStats } from "$lib/utils/types";
import type { LayoutLoad, } from "./$types";

export const load: LayoutLoad = async ({ depends, params, parent, fetch }) => {
    depends('layout:transactions')
    await parent();
    log(`in transaction layout load, started`)
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

    let membersPromise: Promise<{ members: member[] }>
    if (memberStore.members.length > 0 && businessId === memberStore.businessId) {
        membersPromise = Promise.resolve({
            members: memberStore.members.filter((v) => { if (v.role == "employee") return v })
        })
    } else {
        memberStore.businessId = businessId
        membersPromise = businessApi.listMembers(businessId, fetch)
            .then((res) => {
                memberStore.members = res.members
                return res
            })
    }


    log(`in transaction layout load, ended`)

    return {
        transactionsPromise,
        partyPromise: getPartyPromise(businessId, fetch),
        categoryPromise: getCategoryPromise(businessId, fetch),
        partyPlacespromise: getPartyPlacesPromise(businessId, fetch),
        membersPromise,
    };
};
