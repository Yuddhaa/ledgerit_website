import { Capacitor } from '@capacitor/core';
import terminal from 'virtual:terminal';
export function log(...args: any[]) {
    if (Capacitor.getPlatform() === 'web') {
        console.log(...args);
    } else {
        terminal.log(...args);
    }
}

import type { category, party, transactionChange } from "./types";
import { categoryStore, partiesStore } from '$lib/stores/store.svelte';
import partiesApi from '$lib/api/partiesApi';
import categoriesApi from '$lib/api/categoriesApi';

/**
 * Compares two transactionChange objects and returns an array of keys that differ.
 */
export function getTransactionDiff(original: transactionChange, requested: transactionChange): (keyof transactionChange)[] {
    const keys: (keyof transactionChange)[] = [
        'amount',
        'direction',
        'mode',
        'party_name',
        'category_name',
        'receipt_no',
        'description'
    ];

    return keys.filter(key => {
        // Strict comparison after trimming/stringifying to avoid "100.00" vs "100" false positives
        return String(original[key]).trim() !== String(requested[key]).trim();
    });
}

/**
 * Simple mapper for cleaner UI labels
 */
export const diffLabels: Record<keyof transactionChange, string> = {
    amount: 'Amount',
    direction: 'Type (In/Out)',
    mode: 'Payment Mode',
    party_name: 'Party',
    category_name: 'Category',
    receipt_no: 'Receipt #',
    description: 'Note/Description',
    category_id: 'Category ID',
    party_id: 'Party ID'
};

/**
 * getPartyPromise returns a promise and on resove parties of a business.
 * */
export function getPartyPromise(businessId: string, customFetch?: typeof fetch): Promise<{
    parties: party[];
}> {
    let partyPromise: Promise<{ parties: party[] }>
    if (partiesStore.parties.length > 0 || partiesStore.businessId === businessId) {
        partyPromise = Promise.resolve({ parties: partiesStore.parties })
    } else {
        partyPromise = partiesApi.listAll(businessId, {}, customFetch)
            .then((res) => {
                partiesStore.businessId = businessId
                partiesStore.parties = res.parties;
                return res
            });
    }
    return partyPromise
}

/**
 * getPartyPlacesPromise returns a promise and on resove places in parties of a business.
 * */
export function getPartyPlacesPromise(businessId: string, customFetch?: typeof fetch): Promise<{
    places: string[];
}> {
    let placesPromise: Promise<{ places: string[] }>
    if (partiesStore.places.length > 0 || partiesStore.businessId === businessId) {
        placesPromise = Promise.resolve({ places: partiesStore.places })
    } else {
        placesPromise = partiesApi.listPlaces(businessId, customFetch)
            .then((res) => {
                partiesStore.businessId = businessId
                partiesStore.places = res.places;
                return res
            });
    }
    return placesPromise
}




/**
 * getCategoryPromise returns a promise and on resove parties of a business.
 * */
export function getCategoryPromise(businessId: string, customFetch?: typeof fetch): Promise<{
    categories: category[];
}> {
    let categoryPromise: Promise<{ categories: category[] }>
    if (categoryStore.categories.length > 0 || categoryStore.businessId === businessId) {
        categoryPromise = Promise.resolve({ categories: categoryStore.categories })
    } else {
        categoryPromise = categoriesApi.listAll(businessId, customFetch)
            .then((res) => {
                categoryStore.businessId = businessId
                categoryStore.categories = res.categories;
                return res
            });
    }
    return categoryPromise
}
