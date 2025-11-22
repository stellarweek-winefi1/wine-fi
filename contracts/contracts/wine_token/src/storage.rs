use soroban_sdk::{Address, Env};
use soroban_token_sdk::metadata::TokenMetadata;
use common::models::WineLotMetadata;

pub(crate) const DAY_IN_LEDGERS: u32 = 17280;
pub(crate) const INSTANCE_BUMP_AMOUNT: u32 = 30 * DAY_IN_LEDGERS;
pub(crate) const INSTANCE_LIFETIME_THRESHOLD: u32 = INSTANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;
pub(crate) const BALANCE_BUMP_AMOUNT: u32 = 120 * DAY_IN_LEDGERS;
pub(crate) const BALANCE_LIFETIME_THRESHOLD: u32 = BALANCE_BUMP_AMOUNT - DAY_IN_LEDGERS;

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub enum DataKey {
    Admin,
    WineLotMetadata,
    Balance(Address),
    Metadata,
}

// Admin functions
pub fn read_administrator(e: &Env) -> Address {
    let key = DataKey::Admin;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_administrator(e: &Env, id: &Address) {
    let key = DataKey::Admin;
    e.storage().instance().set(&key, id);
}

// Wine Lot Metadata functions
pub fn read_wine_lot_metadata(e: &Env) -> WineLotMetadata {
    let key = DataKey::WineLotMetadata;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_wine_lot_metadata(e: &Env, metadata: &WineLotMetadata) {
    let key = DataKey::WineLotMetadata;
    e.storage().instance().set(&key, metadata);
}

// Metadata functions
pub fn read_metadata(e: &Env) -> TokenMetadata {
    let key = DataKey::Metadata;
    e.storage().instance().get(&key).unwrap()
}

pub fn write_metadata(e: &Env, metadata: TokenMetadata) {
    let key = DataKey::Metadata;
    e.storage().instance().set(&key, &metadata);
}

// Balance functions
pub fn read_balance(e: &Env, addr: Address) -> i128 {
    let key = DataKey::Balance(addr);
    if let Some(balance) = e.storage().persistent().get::<DataKey, i128>(&key) {
        e.storage()
            .persistent()
            .extend_ttl(&key, BALANCE_LIFETIME_THRESHOLD, BALANCE_BUMP_AMOUNT);
        balance
    } else {
        0
    }
}

fn write_balance(e: &Env, addr: Address, amount: i128) {
    let key = DataKey::Balance(addr);
    e.storage().persistent().set(&key, &amount);
    e.storage()
        .persistent()
        .extend_ttl(&key, BALANCE_LIFETIME_THRESHOLD, BALANCE_BUMP_AMOUNT);
}

pub fn receive_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    write_balance(e, addr, balance + amount);
}

pub fn spend_balance(e: &Env, addr: Address, amount: i128) {
    let balance = read_balance(e, addr.clone());
    if balance < amount {
        panic!("Insufficient balance");
    }
    write_balance(e, addr, balance - amount);
}


