import businessApi from "$lib/api/businessApi";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
    await parent()
    console.log("in / page load")
    try {
        const business = await businessApi.listAll(fetch)
        console.log("exiting / page load")
        return { business: business.business }
    } catch (err: any) {
        console.log("err:", err)
        return { business: [] }
    }
}

