/**
 * to get all business a user is member of
 */
import businessApi from "$lib/api/businessApi";
import { businessStore } from "$lib/stores/store.svelte";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
    await parent()
    console.log("in / page load")
    if (businessStore.business.length != 0) {
        return { business: businessStore.business }
    }
    try {
        const business = await businessApi.listAll(fetch)
        console.log("exiting / page load")
        businessStore.business = business.business
        return { business: business.business }
    } catch (err: any) {
        console.log("err:", err)
        return { business: [] }
    }
}

