import cookies from "$lib/utils/cookies"
import { redirect } from "@sveltejs/kit"
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
    const token = await cookies.get('access_token')
    if (token) {
        throw redirect(307, '/')
    };
};
