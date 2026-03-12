import type { subscriptions_status, business, plans } from "$lib/utils/types";
import api from "./api";

type period = 'monthly' | 'yearly' | 'permanent'
type basePlan = "solo" | "wholesale" | "owner"

export interface subscriptionBody {
    period: period
    base_plan: basePlan
    add_on: string
    offer_code?: string
}

export interface subscriptionReturn {
    type: "subscription" | "order",
    subscription_id: string,
    razorpay_key: string,
    razorpay_sub_id?: string,
    short_url?: string,
    razorpay_order_id?: string,
}

export default {
    /**
     * listPlans does api call to get the plan and current plans (if exists) details
     * */
    listPlans: (businessId: string, customFetch?: typeof fetch) => api.Get<plans>(`/business/${businessId}/subscriptions/plans`, customFetch), // add plans type
    /**
     * trial is used to opt trial for a business
     * */
    trial: (businessId: string, body: subscriptionBody, customFetch?: typeof fetch) => api.Post<business>(`/business/${businessId}/subscriptions/trial`, body, customFetch),
    /**
     * create is used to buy first time subscription for a business
     * */
    create: (businessId: string, body: subscriptionBody, customFetch?: typeof fetch) => api.Post<subscriptionReturn | string>(`/business/${businessId}/subscriptions/create`, body, customFetch),
    /**
     * update is used to update the existing subscriptions of the business
     * */
    update: (businessId: string, body: subscriptionBody, customFetch?: typeof fetch) => api.Post<subscriptionReturn | string>(`/business/${businessId}/subscriptions/update`, body, customFetch),
    /**
     * validate validates the offercode
     * */
    validate: (businessId: string, offerCode: string, customFetch?: typeof fetch) => api.Post<plans>(`/business/${businessId}/subscriptions/offers/validate`, { offer_code: offerCode }, customFetch),
    /** 
     * status is used to validate if the payment is successfull.
     * */
    status: (businessId: string, subId: string, customFetch?: typeof fetch) => api.Get<{ status: subscriptions_status }>(`/business/${businessId}/subscriptions/${subId}/status`, customFetch)
}
