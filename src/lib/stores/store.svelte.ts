import type { business, user } from "$lib/utils/types"

class authState {
    user = $state<user | null>(null)
    isLoggedIn = $derived(this.user !== null)
}

export const auth = new authState()

export const businessStore = $state<{ selected: business | null }>({
    selected: null
})

export const ui = $state({
    theme: "light" as "light" | "dark",
    showUniversalSettings: false
});
