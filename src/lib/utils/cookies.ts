import { browser } from "$app/environment";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export default {
    /** 
     * setCookies is used to set cookies in clint browser
     * it will return null if this is run in server side
     * */
    set: async (name: string, value: string, path: string = '/', days: number = 30) => {
        if (Capacitor.getPlatform() === "web") {
            if (!browser) return

            const expires = new Date(Date.now() + days * 864e5).toUTCString()
            document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}; SameSite=Lax; Secure`
        } else {
            await Preferences.set({
                key: name,
                value
            })
        }
    },

    /** 
     * getCookies is used to get cookies in client browser
     * it will return null if this is run in server side
     * */
    get: async (name: string): Promise<string | null> => {
        if (Capacitor.getPlatform() === "web") {
            if (!browser) return null
            const value = `; ${document.cookie}`
            const parts = value.split(`; ${name}=`)
            if (parts.length === 2) {
                return decodeURIComponent(parts.pop()?.split(";").shift() || '')
            }
        } else {
            return (await Preferences.get({ key: name })).value
        }
        return null
    },


    /** 
     * DeleteCookies is used to delete cookies in client browser
     * it will return null if this is run in server side
     * */
    delete: async (name: string, path: string = '/') => {
        if (Capacitor.getPlatform() === "web") {
            if (!browser) return
            document.cookie =
                `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ` +
                `path=${path}; SameSite=Lax; Secure`
        } else {
            await Preferences.remove({ key: name });
        }
    },
}
