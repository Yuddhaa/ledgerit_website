import businessApi from "$lib/api/businessApi";
import transactionsApi from "$lib/api/transactionsApi";
import { approvalStore, memberStore, type member } from "$lib/stores/store.svelte";
import { getCategoryPromise, getPartyPromise } from "$lib/utils/helpers";
import type { approval } from "$lib/utils/types";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ depends, fetch, params, parent }) => {
    depends('data:approval')
    await parent()
    const businessId = params.id

    let approvalPromise: Promise<{ requests: approval[] }>
    if (approvalStore.approvals.length > 0 && approvalStore.businessId == businessId) {
        approvalPromise = Promise.resolve({ requests: approvalStore.approvals })
    } else {
        approvalStore.businessId = businessId
        approvalPromise = transactionsApi.listApprovals(businessId, approvalStore.filter, fetch)
            .then((res) => {
                approvalStore.approvals = res.requests ? res.requests : []
                return res
            })
    }

    let employeesPromise: Promise<{ members: member[] }>
    if (memberStore.members.length > 0 && businessId === memberStore.businessId) {
        employeesPromise = Promise.resolve({
            members: memberStore.members.filter((v) => { if (v.role == "employee") return v })
        })
    } else {
        memberStore.businessId = businessId
        employeesPromise = businessApi.listMembers(businessId, fetch)
            .then((res) => {
                memberStore.members = res.members
                return {
                    members: res.members.filter((v) => { if (v.role == "employee") return v })
                }

            })
    }

    return {
        approvalPromise,
        employeesPromise,
        partyPromise: getPartyPromise(businessId, fetch),
        categoryPromise: getCategoryPromise(businessId, fetch),
    }
}
