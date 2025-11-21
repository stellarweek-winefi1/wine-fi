# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:
```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

- New Soroban contracts can be put in `contracts`, each in their own directory. There is already a `hello_world` contract in there to get you started, plus the `wine_lot_manager` contract used by Winefy.
- `wine_lot_manager`: manages wine lot metadata and enforces supply caps for each tokenized batch (init, mint, and sale accounting helpers).

## 🚀 Quick Start con Stellar Devnet

Para configurar una devnet de Stellar y probar estos contratos:

```bash
# Opción 1: Script de inicio rápido (recomendado)
./quick_start.sh

# Opción 2: Script manual de despliegue
./deploy_and_test.sh testnet test-account

# Opción 3: Seguir la guía completa
# Ver SETUP_DEVNET.md para instrucciones detalladas
```

**Requisitos previos:**
- Rust y Cargo instalados
- Stellar CLI instalado (`cargo install --locked stellar-cli`)
- Cuenta de Stellar Testnet con lumens (obtén gratis en https://laboratory.stellar.org/#account-creator?network=testnet o usa `stellar keys fund`)

## Common Commands

From the workspace root:

```bash
# Build all contracts
cargo build --release -p wine-lot-manager

# Run unit tests (includes testutils)
cargo test -p wine-lot-manager

# Example: mint a bottle
stellar contract invoke \
  <BOTTLE_FACTORY_ID> \
  --function mint_bottle \
  --source-account <ACCOUNT_NAME> \
  --network testnet \
  -- \
  --lot_id "MALBEC-2024-001" \
  --bottle_number 1 \
  --winery <WINERY_ADDRESS> \
  --wine_name "Gran Reserva Malbec" \
  --vintage 2024 \
  --metadata_uri "ipfs://Qm..."

# Example: get bottle info
stellar contract invoke \
  <BOTTLE_FACTORY_ID> \
  --function get_bottle \
  --source-account <ACCOUNT_NAME> \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001"

# Example: log a traceability event
stellar contract invoke \
  <TRACEABILITY_LOG_ID> \
  --function log_event \
  --source-account <ACCOUNT_NAME> \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001" \
  --event_type Bottling \
  --actor <ACTOR_ADDRESS> \
  --description "Bottled at winery"

# Example: get event history
stellar contract invoke \
  <TRACEABILITY_LOG_ID> \
  --function get_history \
  --source-account <ACCOUNT_NAME> \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001"

# Example: transfer ownership
stellar contract invoke \
  <TRANSFER_ID> \
  --function transfer \
  --source-account <ACCOUNT_NAME> \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001" \
  --to <NEW_OWNER_ADDRESS>
```
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.