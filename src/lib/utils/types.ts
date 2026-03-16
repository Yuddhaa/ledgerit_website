export interface user {
    id: string,
    name: string,
    email: string,
    phone_number: string,
    google_id: string,
    picture?: string,
    is_trial_used: boolean,
}

export type role = 'creator' | 'admin' | 'employee'
export interface business {
    id: string,
    name: string,
    owner_id: string,
    current_plan_id: string,
    subscriptions_status: subscriptions_status,
    subscription_end_period: string,
    is_trial_used: boolean,
    current_subscription_id: string,
    is_offer_used: boolean,
    offer_code?: string,
    role: role,
    current_balance: number,
}

export type subscriptions_status = 'inactive' | 'pending' | 'trialing' | 'trialing_pending' | 'active' | 'past_due' | 'paused' | 'canceled' | 'expired' | 'authenticated' | 'trial_ended';

export interface plans {
    current_plan: currentPlans | null,
    is_free_available: boolean,
    is_trial_available: boolean,
    is_offer_available: boolean,
    monthly_addon: number,
    yearly_addon: number,
    base_plans: { solo: basePlan, wholesale: basePlan, owner: basePlan }
}


interface currentPlans {
    plan_id: string,
    base_plan: string,
    add_on: string,
    period: string,
    members_count: number,
    status: subscriptions_status,
    name: string,
    amount: number,
    currency: string,
    subscription_end_period: string,
    subscription_id: string,
    razorpay_subscription_id: string
}

export interface basePlan {
    level: number,
    monthly_base_price: number,
    yearly_base_price: number,
    users_limit: number
}

export interface error {
    status: string,
    message: string
}

export interface transaction {
    id: string
    business_id: string
    user_id: string
    amount: number
    direction: "in" | "out"
    category_id: string | null
    category_name: string | null
    party_id: string
    party_name: string
    mode: "online" | "cash" | "cheque"
    receipt_no: string
    description: string
    created_at: string
    updated_at: string
    user_name: string
}

export type approvalType = "edit" | "delete"
export type approvalStatus = "pending" | "approved" | "rejected"
export interface transactionChange {
    amount: string
    direction: "in" | "out"
    category_id: string
    party_id: string
    mode: string
    receipt_no: string
    description: string
    category_name: string
    party_name: string
}
export interface approval {
    id: string
    transaction_id: string
    type: approvalType
    status: approvalStatus
    reason: string
    created_at: string
    updated_at: string

    requested_by_id: string
    requested_by_name: string

    reviewed_by_id: string | null
    reviewed_by_name: string | null

    requested_changes: transactionChange
    original: transactionChange
}


export interface tranStats {
    cash_in: number,
    cash_out: number,
    net_balance: number,
}

export interface party {
    id: string,
    name: string,
    place: string,
    phone_number: string,
    business_id: string,
    created_at: string,
    updated_at: string,
}

export interface category {
    id: string
    business_id: string
    name: string
    created_at: string
    updated_at: string,
}
