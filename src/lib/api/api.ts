import { browser } from "$app/environment";
import { PUBLIC_API_V1 } from "$env/static/public";
import cookies from "$lib/utils/cookies";
import { log } from "$lib/utils/helpers";

export default {
    /** Get api */
    Get: <T>(path: string, customFetch?: typeof fetch) =>
        api<T>(path, {
            method: "Get",
        }, customFetch),

    /** post api */
    Post: <T>(
        path: string,
        body: unknown, customFetch?: typeof fetch
    ) =>
        api<T>(path, {
            method: "POST",
            body: JSON.stringify(body),
        }, customFetch),

    /** put api */
    Put: <T>(
        path: string,
        body: unknown, customFetch?: typeof fetch
    ) =>
        api<T>(path, {
            method: "PUT",
            body: JSON.stringify(body),
        }, customFetch),

    /** patch api */
    Patch: <T>(
        path: string,
        body: unknown, customFetch?: typeof fetch
    ) =>
        api<T>(path, {
            method: "PATCH",
            body: JSON.stringify(body),
        }, customFetch),

    /** delete api */
    Delete: <T>(
        path: string,
        body: unknown, customFetch?: typeof fetch
    ) =>
        api<T>(path, {
            method: "DELETE",
            body: JSON.stringify(body),
        }, customFetch),

}

/**
 * The core API wrapper
 * It manually attaches the Bearer token for the Go backend.
 * it even handles the refresh of the access_token
 */
async function api<T>(path: string, options: RequestInit = {}, customFetch?: typeof fetch): Promise<T> {
    const url = `${PUBLIC_API_V1}${path}`;

    // log(`fetching \n${options.method} :${path},\n options:${JSON.stringify(options, null, 4)} \n\n\n`)
    log(`\n${options.method} ${path} started\n`)

    // get access token
    const token = browser ? await cookies.get("access_token") : null

    // set headers
    const headers = new Headers(options.headers ?? {})
    if (token) {
        headers.set("Authorization", `Bearer ${token}`)
    }
    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }
    // TODO: remove this later __________________________________________________________________________________________________________________________________________________________________________________
    headers.set("ngrok-skip-browser-warning", "true");
    // TODO: remove this later __________________________________________________________________________________________________________________________________________________________________________________

    // Initial Request
    const fetcher = customFetch || fetch
    let res = await fetcher(url, { ...options, headers })

    if (res.status === 401) {
        const ok = await handleRefresh();

        if (!ok) throw { status: 401, message: "Unauthorized" };

        // Re-read the new token and retry
        const newToken = await cookies.get('access_token');
        if (!newToken) throw { status: 401, message: "Unauthorized" };

        headers.set('Authorization', `Bearer ${newToken}`);
        res = await fetch(url, { ...options, headers });
    }

    if (!res.ok) {
        log("inside res!ok")
        if (!res.ok) {
            const errorBody = await res.json().catch(() => null);

            const message =
                errorBody?.message ||
                errorBody?.error ||
                (res.status === 500 ? "Internal API Error" : "Request failed");

            log(JSON.stringify(errorBody));

            throw { status: res.status, message };
        }
        // const error = await res.json().catch(() => { if (res.status === 500) return { message: "Inernal API Error" }; else { return { message: res.json() } } });
        // log(JSON.stringify(error))
        // throw { status: res.status, message: error.message };
    }

    log(`${options.method} ${path} is completed`)

    const contentType = res.headers.get("content-type") || "";

    let data: any;

    if (contentType.includes("application/json")) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    return data as T;
}

/** 
* handleRefresh refreshs the access token when it is invalid
* */
async function handleRefresh(): Promise<boolean> {
    log("handleRefresh is called")
    const refreshToken = browser ? await cookies.get("refresh_token") : null;
    if (!refreshToken) {
        redirectToLogin()
        return false
    }

    const refreshUrl = PUBLIC_API_V1 + '/auth/refresh'

    try {
        const res = await fetch(refreshUrl, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "refresh_token": refreshToken })
        })

        if (res.ok) {
            const data = await res.json();
            // Store new tokens
            await cookies.set('access_token', data.access_token, "/", 2);
            await cookies.set('refresh_token', data.refresh_token, "/", 35);
            log("handleRefresh is finished")
            return true
        }

    } catch (err: any) {
        console.error("Refresh flow failed", err);
    }

    // if no error and !res.ok below code will be executed
    cookies.delete("access_token")
    cookies.delete("refresh_token")
    redirectToLogin()
    log("handleRefresh is finished")
    return false
}

/**
 * redirectToLogin redirects the user to login page
 * */
function redirectToLogin() {
    if (browser)
        window.location.href = "/login"
}
