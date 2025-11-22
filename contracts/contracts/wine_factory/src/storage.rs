use soroban_sdk::{Address, BytesN, Env};
use crate::WineFactoryError;

const DAY_IN_LEDGERS: u32 = 17280;
const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub enum DataKey {
    Admin,
    TokenWasmHash,
    TotalTokens,
    Token(u32),
}

pub fn extend_instance_ttl(e: &Env) {
    e.storage()
        .instance()
        .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
}

// Admin
pub fn get_admin(e: &Env) -> Result<Address, WineFactoryError> {
    e.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(WineFactoryError::AdminNotFound)
}

pub fn put_admin(e: &Env, admin: &Address) {
    e.storage().instance().set(&DataKey::Admin, admin);
}

// Token WASM Hash
pub fn get_token_wasm_hash(e: &Env) -> Result<BytesN<32>, WineFactoryError> {
    e.storage()
        .instance()
        .get(&DataKey::TokenWasmHash)
        .ok_or(WineFactoryError::NotInitialized)
}

pub fn put_token_wasm_hash(e: &Env, hash: BytesN<32>) {
    e.storage().instance().set(&DataKey::TokenWasmHash, &hash);
}

// Total Tokens
pub fn get_total_tokens(e: &Env) -> u32 {
    e.storage()
        .instance()
        .get(&DataKey::TotalTokens)
        .unwrap_or(0)
}

fn set_total_tokens(e: &Env, count: u32) {
    e.storage().instance().set(&DataKey::TotalTokens, &count);
}

// Token Management
pub fn add_new_token(e: &Env, token_address: Address) {
    let total = get_total_tokens(e);
    e.storage().instance().set(&DataKey::Token(total), &token_address);
    set_total_tokens(e, total + 1);
}

pub fn get_token_by_index(e: &Env, index: u32) -> Result<Address, WineFactoryError> {
    e.storage()
        .instance()
        .get(&DataKey::Token(index))
        .ok_or(WineFactoryError::TokenNotFound)
}


