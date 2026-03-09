import subscriptionsApi from "$lib/api/subscriptionsApi";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ depends, fetch, params, parent }) => {
    await parent()
    depends('app:plans')
    console.log(`/plans page load started`)
    const businessId: string = params.id
    try {
        const plans = await subscriptionsApi.listPlans(businessId, fetch)
        console.log(`/plans page load ended`)
        return { plans }
    } catch (err: any) {
        console.log("error in plans page load, err:", err)
        throw error(500, "Failed to load plans");
    }
}
