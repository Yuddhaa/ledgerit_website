import { getCategoryPromise, getPartyPlacesPromise, getPartyPromise } from "$lib/utils/helpers";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params, fetch }) => {
    const businessId = params.id
    return {
        partiesPromise: getPartyPromise(businessId, fetch),
        categoriesPromise: getCategoryPromise(businessId, fetch),
        partyPlacesPromise: getPartyPlacesPromise(businessId, fetch)
    }
}
