import businessApi from "$lib/api/businessApi";
import { businessStore } from "$lib/stores/store.svelte";
import { error, redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";
import type { business } from "$lib/utils/types";

/**
 * `(app)/[id]/+layout load` does and api call to get the business with [id] and
 * sets the business state in store
 * */
export const load: LayoutLoad = async ({ depends, parent, fetch, params, url }) => {
    depends("apps:business")
    await parent();
    console.log("(app)/[id]/+layout load is started")
    const businessId = params.id;
    let businessData: business;

    try {
        if (businessStore.selected?.id === params.id) {
            businessData = businessStore.selected
        } else {
            const response = await businessApi.listOne(businessId, fetch);
            businessData = response.business;
            businessStore.selected = businessData;
        }
    } catch (err: any) {
        console.error('API Error in (app)/[id]/+layout load:', err);
        // You might want to redirect to a 404 or error page here
        return error(err.status, err.message)
    }

    console.log("(app)/[id]/+layout load is ended")
    // redirect logic (Outside try/catch)
    // Always check if we aren't ALREADY on the plans page to avoid infinite loops
    const deadStatuses = ['inactive', 'canceled', 'expired', 'past_due'];

    // Check if the current status is in our "Dead" list
    const isDead = deadStatuses.includes(businessData.subscriptions_status);

    if (isDead && !url.pathname.endsWith('/plans')) {
        console.log(`Status is ${businessData.subscriptions_status}. Redirecting to plans...`);
        throw redirect(307, `/${businessId}/plans`);
    }

    return {
        businessId,
        business: businessData
    };
}
