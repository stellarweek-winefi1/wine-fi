use soroban_sdk::{testutils::Address as _, Address, Env, BytesN};
use crate::error::FactoryError;
use crate::storage::DataKey;
use crate::test::{create_vinifica_factory, vinifica_vault_contract, vinificaFactoryTest};
use crate::constants::MAX_VINIFICA_FEE;

fn retrieve_value(env: &Env, key: DataKey) -> Result<BytesN<32>, FactoryError> {
    env.storage().instance().get(&key).ok_or(FactoryError::NotInitialized)
}

#[test]
fn get_storage() {
    let test = vinificaFactoryTest::setup();

    let factory_admin = test.factory_contract.admin();
    let factory_vinifica_receiver = test.factory_contract.vinifica_receiver();
    let key = DataKey::vinificaWasmHash;
    let vault_wasm = test.env.as_contract(&test.factory_contract.address,|| retrieve_value(&test.env, key));

    assert_eq!(vault_wasm.unwrap(), test.vinifica_wasm_hash);
    assert_eq!(factory_admin, test.admin);
    assert_eq!(factory_vinifica_receiver, test.vinifica_receiver);
}


#[test]
#[should_panic(expected = "HostError: Error(Context, InvalidAction)")] //FactoryError::FeeTooHigh (#406)
fn initialize_excesive_fees(){
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let vinifica_receiver = Address::generate(&env);

    let vinifica_fee = MAX_vinifica_FEE + 1;
    let vinifica_wasm_hash = env
        .deployer()
        .upload_contract_wasm(vinifica_vault_contract::WASM);

    let _factory_contract = create_vinifica_factory(
        &env,
        &admin,
        &vinifica_receiver,
        vinifica_fee,
        &vinifica_wasm_hash,
    ); //This should panic
}