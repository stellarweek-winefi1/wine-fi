#![no_std]

use common::models::WineLotMetadata;
use soroban_sdk::{
    contract, contractimpl, vec, Address, BytesN, Env, IntoVal, String, Val, Vec,
};

mod storage;
use storage::{
    add_new_token, extend_instance_ttl, get_admin, get_total_tokens, get_token_by_index,
    get_token_wasm_hash, put_admin, put_token_wasm_hash,
};

pub trait WineFactoryTrait {
    /// Initialize the factory contract
    ///
    /// # Arguments
    /// * `admin` - The address of the contract administrator
    /// * `token_wasm_hash` - The hash of the wine token WASM file
    fn __constructor(
        e: Env,
        admin: Address,
        token_wasm_hash: BytesN<32>,
    ) -> Result<(), WineFactoryError>;

    /// Create a new wine lot token
    ///
    /// # Arguments
    /// * `admin` - Token admin (typically the winery)
    /// * `decimal` - Number of decimals
    /// * `name` - Token name
    /// * `symbol` - Token symbol
    /// * `wine_lot_metadata` - Wine-specific metadata
    ///
    /// # Returns
    /// * Address of the newly created token
    fn create_wine_token(
        e: Env,
        admin: Address,
        decimal: u32,
        name: String,
        symbol: String,
        wine_lot_metadata: WineLotMetadata,
    ) -> Result<Address, WineFactoryError>;

    // --- Admin Functions ---
    
    /// Set a new admin address
    fn set_admin(e: Env, new_admin: Address) -> Result<(), WineFactoryError>;

    /// Update the token WASM hash
    fn set_token_wasm_hash(e: Env, new_token_wasm_hash: BytesN<32>) -> Result<(), WineFactoryError>;

    // --- Read Methods ---
    
    /// Get the current admin address
    fn admin(e: Env) -> Result<Address, WineFactoryError>;

    /// Get the total number of deployed tokens
    fn total_tokens(e: Env) -> Result<u32, WineFactoryError>;

    /// Get a token address by its index
    fn get_token_by_index(e: Env, index: u32) -> Result<Address, WineFactoryError>;

    /// Get the current token WASM hash
    fn token_wasm_hash(e: Env) -> Result<BytesN<32>, WineFactoryError>;
}

#[contract]
struct WineFactory;

// Deploy a new token contract
fn create_wine_token_contract(
    e: &Env,
    token_wasm_hash: BytesN<32>,
    admin: Address,
    decimal: u32,
    name: String,
    symbol: String,
    wine_lot_metadata: WineLotMetadata,
) -> Address {
    let total_tokens = get_total_tokens(e);

    // Generate salt based on total tokens
    let salt = {
        let mut salt_bytes = [0u8; 32];
        let total_tokens_bytes = total_tokens.to_be_bytes();
        let len = total_tokens_bytes.len();
        salt_bytes[..len].copy_from_slice(&total_tokens_bytes);
        BytesN::from_array(e, &salt_bytes)
    };

    // Prepare constructor arguments
    let mut init_args: Vec<Val> = vec![e];
    init_args.push_back(admin.to_val());
    init_args.push_back(decimal.into_val(e));
    init_args.push_back(name.to_val());
    init_args.push_back(symbol.to_val());
    init_args.push_back(wine_lot_metadata.into_val(e));

    // Deploy the contract
    e.deployer()
        .with_current_contract(salt)
        .deploy_v2(token_wasm_hash, init_args)
}

#[contractimpl]
impl WineFactoryTrait for WineFactory {
    fn __constructor(
        e: Env,
        admin: Address,
        token_wasm_hash: BytesN<32>,
    ) -> Result<(), WineFactoryError> {
        put_admin(&e, &admin);
        put_token_wasm_hash(&e, token_wasm_hash);
        extend_instance_ttl(&e);
        Ok(())
    }

    fn create_wine_token(
        e: Env,
        admin: Address,
        decimal: u32,
        name: String,
        symbol: String,
        wine_lot_metadata: WineLotMetadata,
    ) -> Result<Address, WineFactoryError> {
        extend_instance_ttl(&e);
        
        let token_wasm_hash = get_token_wasm_hash(&e)?;

        let token_address = create_wine_token_contract(
            &e,
            token_wasm_hash,
            admin,
            decimal,
            name,
            symbol,
            wine_lot_metadata,
        );

        add_new_token(&e, token_address.clone());

        // Emit event
        e.events().publish(
            ("create_wine_token", "token_address"),
            token_address.clone(),
        );

        Ok(token_address)
    }

    fn set_admin(e: Env, new_admin: Address) -> Result<(), WineFactoryError> {
        extend_instance_ttl(&e);
        let admin = get_admin(&e)?;
        admin.require_auth();

        put_admin(&e, &new_admin);
        e.events().publish(("set_admin", "new_admin"), new_admin);
        Ok(())
    }

    fn set_token_wasm_hash(e: Env, new_token_wasm_hash: BytesN<32>) -> Result<(), WineFactoryError> {
        extend_instance_ttl(&e);
        let admin = get_admin(&e)?;
        admin.require_auth();

        put_token_wasm_hash(&e, new_token_wasm_hash.clone());
        e.events().publish(("set_token_wasm_hash", "hash"), new_token_wasm_hash);
        Ok(())
    }

    fn admin(e: Env) -> Result<Address, WineFactoryError> {
        extend_instance_ttl(&e);
        get_admin(&e)
    }

    fn total_tokens(e: Env) -> Result<u32, WineFactoryError> {
        extend_instance_ttl(&e);
        Ok(get_total_tokens(&e))
    }

    fn get_token_by_index(e: Env, index: u32) -> Result<Address, WineFactoryError> {
        extend_instance_ttl(&e);
        get_token_by_index(&e, index)
    }

    fn token_wasm_hash(e: Env) -> Result<BytesN<32>, WineFactoryError> {
        extend_instance_ttl(&e);
        get_token_wasm_hash(&e)
    }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[soroban_sdk::contracterror]
#[repr(u32)]
pub enum WineFactoryError {
    NotInitialized = 1,
    AdminNotFound = 2,
    TokenNotFound = 3,
}

