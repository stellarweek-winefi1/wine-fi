mod factory_contract {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/vinifica_factory.optimized.wasm"
    );
    pub type vinificaFactoryClient<'a> = Client<'a>;
}

pub use factory_contract::{AssetStrategySet, vinificaFactoryClient, Strategy};
use soroban_sdk::{Address, BytesN, Env};

// vinifica Factory Contract
pub fn create_factory_contract<'a>(
    e: &Env,
    admin: &Address,
    vinifica_receiver: &Address,
    vinifica_fee: &u32,
    vault_wasm_hash: &BytesN<32>,
) -> vinificaFactoryClient<'a> {
    let args = (
        admin.clone(),
        vinifica_receiver.clone(),
        vinifica_fee.clone(),
        vault_wasm_hash.clone(),
    );

    let address = &e.register(factory_contract::WASM, args);
    let factory = vinificaFactoryClient::new(e, address);

    factory
}
