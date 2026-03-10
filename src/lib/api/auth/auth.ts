import cookies from "$lib/utils/cookies"
import api from "../api"
import { auth } from "$lib/stores/store.svelte"

export const logout = async () => {
    console.log("logout api called")
    const refreshToken = await cookies.get("refresh_token")
    if (refreshToken) {
        try {
            await api.Post<{ message: string }>("/auth/logout", { "refresh_token": refreshToken })
        } catch (err) {
            console.error("Logout request failed, cleaning up local session anyway", err)
        }
    }

    // reset cookies and stores
    cookies.delete("access_token")
    cookies.delete("refresh_token")
    auth.isLoggedIn = false
    auth.user = null as any

    console.log("logout api completed")
}
