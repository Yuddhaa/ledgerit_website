import transactionsApi from "$lib/api/transactionsApi";
import type { transaction } from "$lib/utils/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, url, parent }) => {
    await parent()
    const businessId = params.id
    const editId = url.searchParams.get('edit');

    let transactionPromise: Promise<transaction | null>
    if (editId) {
        // Fetch the specific transaction from your API
        // This ensures the data is fresh and not tampered with in the URL
        transactionPromise = transactionsApi.listone(businessId, editId, fetch).then((res) => {
            return res.transaction
        })
        return { transactionPromise, isEdit: true };
    } else {
        transactionPromise = Promise.resolve(null)
        return { transactionPromise, isEdit: false };
    }

}
