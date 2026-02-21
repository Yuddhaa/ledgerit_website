class authState {
    user = $state<any>(null)
    isLoggedIn = $derived(this.user !== null)
}

export const auth = new authState()
