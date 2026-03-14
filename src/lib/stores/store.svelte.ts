import { log } from "$lib/utils/helpers"
import type { business, party, role, transaction, tranStats, user } from "$lib/utils/types"

class authState {
    user = $state<user | null>(null)
    isLoggedIn = $derived(this.user !== null)
}

export const auth = new authState()

export const businessStore = $state<{
    selected: business | null;
    business: business[];
}>({
    business: [],
    selected: null,
})

export const memberStore = $state<{
    businessId: string | null;
    members: member[]
}>({
    businessId: null,
    members: [],
})

export const ui = $state({
    theme: "light" as "light" | "dark",
    showUniversalSettings: false
});

export const transactionStore = $state<{
    businessId: string | null,
    filter: tranFilter,
    transactions: { stats: tranStats, transactions: transaction[] },
    parties: party[],
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
    parties: [],
})


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


/**
 * retuns true if Apply button should be active
 */
export function isApplyFilterActive(filter: tranFilter): boolean {
    log(`transactionStore.filter:${JSON.stringify(transactionStore.filter)}`)
    log(`filter:${JSON.stringify(filter)}`)
    return JSON.stringify(transactionStore.filter) !== JSON.stringify(filter);
}

/**
 * retuns true if clear button should be active
 */
export function isClrearFilterActive(filter: tranFilter = transactionStore.filter): boolean {
    if (filter.user_id) return true
    if (filter.category_id) return true
    if (filter.party_id) return true
    if (filter.mode) return true
    if (filter.direction) return true
    if (filter.sortBy != "created_at") return true
    if (filter.order != "desc") return true
    if (filter.from) return true
    if (filter.to) return true
    return false
}

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
    transactionStore.parties = [];
    transactionStore.transactions = {
        stats: { cash_in: 0, cash_out: 0, net_balance: 0 },
        transactions: []
    };
}

export interface member {
    id: string,
    name: string,
    email: string,
    phone_number: string,
    role: role,
    current_balance: number,
}
