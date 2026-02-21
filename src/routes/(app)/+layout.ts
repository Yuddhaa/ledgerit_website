import cookies from "$lib/utils/cookies";
import { redirect } from "@sveltejs/kit";
import api from "$lib/api/api";
import { auth } from "$lib/stores/store.svelte";
import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async ({ fetch }) => {
    console.log("in layoutload")

    // check if already loggedin
    const token = cookies.get("access_token")
    // if not, redirect to login
    if (!token) {
        console.log("exiting layoutload and -> /login")
        throw redirect(307, "/login")
    }

    // if so, set the user context in the store
    try {
        let user: any;
        if (!auth.isLoggedIn) {
            user = await api.Get<any>('/users/me', fetch)
            auth.user = user.user
        }

        console.log("exiting layoutload")
        console.log(JSON.stringify(user, null, 4))
        return { user: user.user }
    } catch (err: any) {
        cookies.delete("access_token");
        cookies.delete("refresh_token");
        auth.user = null as any
        auth.isLoggedIn = false
        console.log("in root layout load, err:", err)
    }
}


