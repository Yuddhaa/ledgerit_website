import api from "$lib/api/api";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, parent }) => {
    await parent()
    console.log("in / page load")
    try {
        const business = await api.Get<any>("/business/", fetch)
        console.log("exiting / page load")
        return { business: business.business }
    } catch (err: any) {
        console.log("err:", err)
    }
}

