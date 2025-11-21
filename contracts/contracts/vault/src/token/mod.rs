//#![no_std]

mod allowance;
mod balance;
mod contract;
mod metadata;
mod storage_types;
mod total_supply;
mod wine_lot_metadata;

pub use contract::VaultToken;
// pub use contract::VaultTokenClient;
pub use contract::{internal_burn, internal_mint};
pub use metadata::write_metadata;
pub use wine_lot_metadata::set_wine_lot_metadata;
