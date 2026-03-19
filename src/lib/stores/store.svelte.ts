import { log } from "$lib/utils/helpers"
import type { approval, approvalStatus, approvalType, business, category, party, role, transaction, tranStats, user } from "$lib/utils/types"

export const isStarting = $state<{ starting: boolean }>({ starting: true })
// ************************************************************************************************
class authState {
    user = $state<user | null>(null)
    isLoggedIn = $derived(this.user !== null)
}

export const auth = new authState()


// ************************************************************************************************
export const ui = $state({
    theme: "light" as "light" | "dark",
    showUniversalSettings: false
});

// ************************************************************************************************
export const businessStore = $state<{
    selected: business | null;
    business: business[];
}>({
    business: [],
    selected: null,
})

// ************************************************************************************************
export interface member {
    id: string,
    name: string,
    email: string,
    phone_number: string,
    role: role,
    current_balance: number,
}

export const memberStore = $state<{
    businessId: string | null;
    members: member[]
}>({
    businessId: null,
    members: [],
})

// ************************************************************************************************
export interface tranFilter {
    user_id?: string
    category_id?: string
    party_id?: string
    mode?: "" | "cash" | "online" | "cheque"
    direction?: "" | "in" | "out"
    sortBy?: "created_at" | "amount"
    order?: "asc" | "desc"
    from?: string
    to?: string
}

export const transactionStore = $state<{
    businessId: string | null,
    filter: tranFilter,
    transactions: { stats: tranStats, transactions: transaction[] },
}>({
    businessId: null,
    filter: {
        direction: "",
        mode: "",
        party_id: "",
        sortBy: "created_at",
        order: "desc",
    },
    transactions: { stats: { cash_in: 0, cash_out: 0, net_balance: 0 }, transactions: [] },
})



// ************************************************************************************************
export interface approvalFilter {
    requested_by?: string[];
    status?: approvalStatus;
    type?: approvalType;
    from?: string;
    to?: string;
}

export const approvalStore = $state<{
    businessId: string | null;
    approvals: approval[],
    filter: approvalFilter,
}>({
    businessId: null,
    approvals: [],
    filter: {
        from: "",
        to: "",
    },
})


// ************************************************************************************************
export const partiesStore = $state<{ businessId: string | null; parties: party[]; places: string[] }>({
    businessId: null,
    parties: [],
    places: []
})

// ************************************************************************************************
export const categoryStore = $state<{ businessId: string | null; categories: category[] }>({
    businessId: null,
    categories: [],
})

// ************************************************************************************************
/**
 * retuns true if Apply button should be active
 */
export function isApplyFilterActive(page: "tran" | "approval" = "tran", filter: tranFilter | approvalFilter): boolean {
    if (page === "tran") return JSON.stringify(transactionStore.filter) !== JSON.stringify(filter);
    else {
        log(`approvalStore.filter:${JSON.stringify(approvalStore.filter)}`)
        log(`filter:${JSON.stringify(filter)}`)
        return JSON.stringify({ ...approvalStore.filter, type: "" }) !== JSON.stringify(filter);
    }
}

/**
 * retuns true if clear button should be active
 */
export function isClrearFilterActive(page: "tran" | "approval" = "tran"): boolean {
    if (page === "tran") {
        let tempDefault = {
            direction: "",
            mode: "",
            party_id: "",
            sortBy: "created_at",
            order: "desc",
        }
        return JSON.stringify(transactionStore.filter) !== JSON.stringify(tempDefault);
    } else {
        let tempDefault = {
            from: "",
            to: "",
            status: approvalStore.filter.status,
        }
        return JSON.stringify(approvalStore.filter) !== JSON.stringify(tempDefault);
    }
}

// ************************************************************************************************
/**
 * clearStore resets all global state to initial values.
 * Call this during logout to prevent data leaking between sessions.
 */
export function clearStore() {
    // 1. Reset Auth
    auth.user = null;

    // 2. Reset Business Store
    businessStore.business = [];
    businessStore.selected = null;

    // 3. Reset UI (Optional: usually you keep the theme, but hide modals)
    ui.showUniversalSettings = false;

    // 4. Reset Transaction Store
    transactionStore.businessId = null;
    transactionStore.filter = {};
    transactionStore.transactions = {
        stats: { cash_in: 0, cash_out: 0, net_balance: 0 },
        transactions: []
    };

    memberStore.businessId = null
    memberStore.members = [];

    partiesStore.parties = [];
    partiesStore.businessId = null;
}

