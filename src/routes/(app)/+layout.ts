import cookies from "$lib/utils/cookies";
import { redirect } from "@sveltejs/kit";
import api from "$lib/api/api";
import { auth } from "$lib/stores/store.svelte";
import type { LayoutLoad } from "./$types";
import type { user } from "$lib/utils/types";

export const ssr = false;

export const load: LayoutLoad = async ({ fetch }) => {
    console.log("in / layoutload")

    // check if already loggedin
    const token = cookies.get("access_token")
    // if not, redirect to login
    if (!token) {
        console.log("exiting layoutload and -> /login")
        throw redirect(307, "/login")
    }

    // if so, set the user context in the store
    try {
        let user: { user: user };
        if (!auth.user) {
            user = await api.Get<{ user: user }>('/users/me', fetch)
            auth.user = user.user
        } else {
            user = { user: auth.user }
        }

        console.log("exiting  / layoutload")
        return { user: user.user }
    } catch (err: any) {
        cookies.delete("access_token");
        cookies.delete("refresh_token");
        auth.user = null
        auth.isLoggedIn = false
        console.log("in root layout load, err:", err)
    }
}


