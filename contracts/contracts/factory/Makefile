# Declare the dependencies of the factory on vinifica
default: build

all: test

test: build
	cargo test

build: ../target/wasm32v1-none/release/vinifica_vault.optimized.wasm
	cargo build --target wasm32v1-none --release
	stellar contract optimize --wasm ../target/wasm32v1-none/release/vinifica_factory.wasm
	@rm ../target/wasm32v1-none/release/vinifica_factory.wasm

../target/wasm32v1-none/release/vinifica_vault.optimized.wasm:
	$(MAKE) -C ../vinifica build

fmt:
	cargo fmt --all --check

clean:
	@rm -f ../target/wasm32v1-none/release/vinifica_vault.optimized.wasm