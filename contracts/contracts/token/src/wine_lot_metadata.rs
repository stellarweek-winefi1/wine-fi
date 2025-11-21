use soroban_sdk::{Env, String};
use crate::storage_types::{DataKey, WineLotMetadata};

pub fn set_wine_lot_metadata(e: &Env, metadata: &WineLotMetadata) {
    let key = DataKey::WineLotMetadata;
    e.storage().instance().set(&key, metadata);
}

pub fn get_wine_lot_metadata(e: &Env) -> Option<WineLotMetadata> {
    let key = DataKey::WineLotMetadata;
    e.storage().instance().get(&key)
}
