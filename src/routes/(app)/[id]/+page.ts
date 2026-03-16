import businessApi from "$lib/api/businessApi";
import { memberStore, type member } from "$lib/stores/store.svelte";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ depends, params, parent, fetch }) => {
    depends('data:members')
    await parent();
    const businessId = params.id;

    let membersPromise: Promise<{ members: member[] }>;

    if (memberStore.members.length > 0 && businessId === memberStore.businessId) {
        membersPromise = Promise.resolve({ members: memberStore.members })
    } else {
        memberStore.businessId = businessId
        membersPromise = businessApi.listMembers(businessId, fetch)
            .then((res) => {
                memberStore.members = res.members
                return res
            })
    }
    return {
        membersPromise
    }
}
