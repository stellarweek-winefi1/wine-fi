use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Strategy {
    pub address: Address,
    pub name: String,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AssetStrategySet {
    pub address: Address,
    pub strategies: Vec<Strategy>,
}

// Wine Lot Metadata
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WineLotMetadata {
    pub lot_id: String,
    pub winery_name: String,
    pub region: String,
    pub country: String,
    pub vintage: u32,
    pub varietal: String,
    pub bottle_count: u32,
    pub description: Option<String>,
    pub token_code: String,
}