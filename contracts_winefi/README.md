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

## Common Commands

From the workspace root:

```bash
# Build all contracts
cargo build --release -p wine-lot-manager

# Run unit tests (includes testutils)
cargo test -p wine-lot-manager

# Invoke via soroban CLI (example)
soroban contract invoke \
  --id <DEPLOYED_ID> \
  --fn get_lot \
  --arg lot_id=1
```
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.