// vinifica Vault Contract
pub mod vinifica_vault_contract {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/vinifica_vault.optimized.wasm"
    );

    pub type VaultContractClient<'a> = Client<'a>;
}

pub use vinifica_vault_contract::{
    AssetStrategySet as VaultAssetStrategySet, ContractError as VaultContractError,
    Strategy as VaultStrategy,
};

pub static MINIMUM_LIQUIDITY: i128 = 1000;
