#![no_std]

use soroban_sdk::{contract, contractimpl, token, Address, Env, String};
use soroban_sdk::token::TokenInterface;
use soroban_token_sdk::metadata::TokenMetadata;
use common::models::WineLotMetadata;

mod storage;
use storage::{
    read_administrator, write_administrator,
    read_wine_lot_metadata, write_wine_lot_metadata,
    read_metadata, write_metadata,
    read_balance, spend_balance, receive_balance,
    INSTANCE_BUMP_AMOUNT, INSTANCE_LIFETIME_THRESHOLD,
};

#[contract]
pub struct WineToken;

#[contractimpl]
impl WineToken {
    /// Initialize a new wine lot token
    ///
    /// # Arguments
    /// * `admin` - Administrator address (typically the winery)
    /// * `decimal` - Number of decimals for the token
    /// * `name` - Token name (e.g., "Malbec Reserve 2024")
    /// * `symbol` - Token symbol (e.g., "MAL24")
    /// * `wine_lot_metadata` - Wine-specific metadata
    pub fn __constructor(
        e: Env,
        admin: Address,
        decimal: u32,
        name: String,
        symbol: String,
        wine_lot_metadata: WineLotMetadata,
    ) {
        if decimal > 18 {
            panic!("Decimal must not be greater than 18");
        }

        write_administrator(&e, &admin);
        write_wine_lot_metadata(&e, &wine_lot_metadata);
        write_metadata(
            &e,
            TokenMetadata {
                decimal,
                name,
                symbol,
            },
        );
    }

    /// Get wine lot metadata
    pub fn get_wine_lot_metadata(e: Env) -> WineLotMetadata {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_wine_lot_metadata(&e)
    }

    /// Mint new tokens (only admin/winery can call)
    pub fn mint(e: Env, to: Address, amount: i128) {
        let admin = read_administrator(&e);
        admin.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        receive_balance(&e, to.clone(), amount);
        
        e.events().publish(("mint", "to"), to.clone());
        e.events().publish(("mint", "amount"), amount);
    }

    /// Update admin (only current admin can call)
    pub fn set_admin(e: Env, new_admin: Address) {
        let admin = read_administrator(&e);
        admin.require_auth();

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        write_administrator(&e, &new_admin);
        e.events()
            .publish(("set_admin", "new_admin"), new_admin);
    }

    /// Get current admin
    pub fn admin(e: Env) -> Address {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_administrator(&e)
    }
}

#[contractimpl]
impl token::TokenInterface for WineToken {
    fn allowance(e: Env, _from: Address, _spender: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        0 // Simple implementation: no allowances
    }

    fn approve(_e: Env, _from: Address, _spender: Address, _amount: i128, _expiration_ledger: u32) {
        panic!("Approve not supported in simple wine token");
    }

    fn balance(e: Env, id: Address) -> i128 {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        read_balance(&e, id)
    }

    fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        receive_balance(&e, to.clone(), amount);
        
        e.events().publish(("transfer", "from"), from);
        e.events().publish(("transfer", "to"), to);
        e.events().publish(("transfer", "amount"), amount);
    }

    fn transfer_from(e: Env, _spender: Address, _from: Address, _to: Address, _amount: i128) {
        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);
        panic!("Transfer_from not supported in simple wine token");
    }

    fn burn(e: Env, from: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic!("Amount must be non-negative");
        }

        e.storage()
            .instance()
            .extend_ttl(INSTANCE_LIFETIME_THRESHOLD, INSTANCE_BUMP_AMOUNT);

        spend_balance(&e, from.clone(), amount);
        
        e.events().publish(("burn", "from"), from);
        e.events().publish(("burn", "amount"), amount);
    }

    fn burn_from(_e: Env, _spender: Address, _from: Address, _amount: i128) {
        panic!("Burn_from not supported in simple wine token");
    }

    fn decimals(e: Env) -> u32 {
        read_metadata(&e).decimal
    }

    fn name(e: Env) -> String {
        read_metadata(&e).name
    }

    fn symbol(e: Env) -> String {
        read_metadata(&e).symbol
    }
}
