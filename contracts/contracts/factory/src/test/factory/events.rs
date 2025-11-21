use soroban_sdk::testutils::Events;
use soroban_sdk::{
  symbol_short, FromVal, String, Symbol, Val, Vec
};

use crate::events::NewFeeRateEvent;
use crate::test::vinificaFactoryTest;
extern crate std;

#[test]
fn new_vinifica_fee(){
  let test = vinificaFactoryTest::setup();
  test.env.mock_all_auths();
  let vinifica_fee = 100u32;
  test.factory_contract.set_vinifica_fee(&vinifica_fee);

  let new_vinifica_fee_event = test.env.events().all().last().unwrap();
  let event_data: Vec<Val> = FromVal::from_val(&test.env, &new_vinifica_fee_event.1);

  let emmiter: String = FromVal::from_val(&test.env, &event_data.get(0).unwrap());
  let symbol: Symbol = FromVal::from_val(&test.env, &event_data.get(1).unwrap());
  let val: NewFeeRateEvent = FromVal::from_val(&test.env, &new_vinifica_fee_event.2);

  let expected_symbol: Symbol = symbol_short!("n_fee");
  let expected_emmiter: String = String::from_str(&test.env, "vinificaFactory");
  let expected_val = NewFeeRateEvent { new_vinifica_fee: vinifica_fee };

  assert_eq!(symbol, expected_symbol);
  assert_eq!(emmiter, expected_emmiter);
  assert_eq!(val, expected_val);

}
