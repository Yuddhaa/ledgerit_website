import { browser } from "$app/environment";

export default {
    /** 
     * setCookies is used to set cookies in clint browser
     * it will return null if this is run in server side
     * */
    set: (name: string, value: string, path: string = '/', days: number = 30) => {
        if (!browser) return

        const expires = new Date(Date.now() + days * 864e5).toUTCString()
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=Lax; Secure`
    },

    /** 
     * getCookies is used to get cookies in client browser
     * it will return null if this is run in server side
     * */
    get: (name: string): string | null => {
        if (!browser) return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(";").shift() || '')
        }
        return null
    },


    /** 
     * DeleteCookies is used to delete cookies in client browser
     * it will return null if this is run in server side
     * */
    delete: (name: string, path: string = '/') => {
        if (!browser) return
        document.cookie =
            `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ` +
            `path=${path}; SameSite=Lax; Secure`
    },
}
