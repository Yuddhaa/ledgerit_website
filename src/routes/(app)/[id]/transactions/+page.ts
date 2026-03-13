import transactionsApi from "$lib/api/transactionsApi";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, parent, fetch }) => {
    await parent()
    const businessId = params.id
    const transactionsPromise = transactionsApi.listAll(businessId, {}, fetch)

    return {
        businessId,
        transactionsPromise
    }
}
