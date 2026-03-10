import cookies from "$lib/utils/cookies";
import { redirect } from "@sveltejs/kit";
import api from "$lib/api/api";
import { auth } from "$lib/stores/store.svelte";
import type { LayoutLoad } from "./$types";
import type { user } from "$lib/utils/types";
import { log } from "$lib/utils/helpers";

export const ssr = false;

export const load: LayoutLoad = async ({ fetch }) => {
    log("in / layoutload")

    // check if already loggedin
    const token = await cookies.get("access_token")
    // if not, redirect to login
    if (!token) {
        log("exiting layoutload and -> /login")
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

        log("exiting  / layoutload")
        return { user: user.user }
    } catch (err: any) {
        cookies.delete("access_token");
        cookies.delete("refresh_token");
        auth.user = null
        auth.isLoggedIn = false
        log("in root layout load, err:", err)
    }
}


