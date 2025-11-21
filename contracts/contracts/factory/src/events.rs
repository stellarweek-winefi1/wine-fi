//! Definition of the Events used in the contract
use common::models::AssetStrategySet;
use soroban_sdk::{contracttype, symbol_short, Address, Env, Map, Vec, BytesN};

// CREATE vinifica VAULT EVENT
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreatevinificaEvent {
    pub roles: Map<u32, Address>,
    pub vault_fee: u32,
    pub assets: Vec<AssetStrategySet>,
}

/// Publishes an `CreatevinificaEvent` to the event stream.
pub(crate) fn emit_create_vinifica_vault(
    e: &Env,
    roles: Map<u32, Address>,
    vault_fee: u32,
    assets: Vec<AssetStrategySet>,
) {
    let event = CreatevinificaEvent {
        roles,
        vault_fee,
        assets,
    };

    e.events()
        .publish(("vinificaFactory", symbol_short!("create")), event);
}

// NEW ADMIN EVENT
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewAdminEvent {
    pub new_admin: Address,
}

pub(crate) fn emit_new_admin(e: &Env, new_admin: Address) {
    let event = NewAdminEvent { new_admin };

    e.events()
        .publish(("vinificaFactory", symbol_short!("nadmin")), event);
}

// NEW vinifica RECEIVER EVENT
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewvinificaReceiverEvent {
    pub new_vinifica_receiver: Address,
}

pub(crate) fn emit_new_vinifica_receiver(e: &Env, new_vinifica_receiver: Address) {
    let event = NewvinificaReceiverEvent {
        new_vinifica_receiver,
    };

    e.events()
        .publish(("vinificaFactory", symbol_short!("nreceiver")), event);
}

// NEW vinifica FEE EVENT
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewFeeRateEvent {
    pub new_vinifica_fee: u32,
}

pub(crate) fn emit_new_vinifica_fee(e: &Env, new_vinifica_fee: u32) {
    let event = NewFeeRateEvent { new_vinifica_fee };

    e.events()
        .publish(("vinificaFactory", symbol_short!("n_fee")), event);
}

// NEW VAULT WASM HASH EVENT
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct NewVaultWasmHashEvent {
    pub new_vault_wasm_hash: BytesN<32>,
}

pub(crate) fn emit_new_vault_wasm_hash(e: &Env, new_vault_wasm_hash: BytesN<32>) {
    let event = NewVaultWasmHashEvent {
        new_vault_wasm_hash,
    };

    e.events()
        .publish(("vinificaFactory", symbol_short!("n_wasm")), event);
}
