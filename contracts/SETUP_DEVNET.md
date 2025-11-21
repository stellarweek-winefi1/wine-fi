# Guía para Configurar Stellar Devnet y Probar Contratos

Esta guía te ayudará a configurar un entorno de desarrollo con Stellar devnet para probar tus contratos Soroban de WineFi.

## Opción 1: Usar Stellar Testnet (Recomendado para empezar)

### Paso 1: Instalar Stellar CLI

```bash
# Instalar Stellar CLI usando cargo
cargo install --locked stellar-cli

# Verificar instalación
stellar --version
```

### Paso 2: Configurar una cuenta en Testnet

```bash
# Generar un nuevo par de claves
stellar keys generate test-account

# O usar una clave existente
stellar keys add test-account --secret-key SXXXXX...

# Ver tus cuentas
stellar keys ls

# Obtener la dirección pública
stellar keys public-key test-account

# Obtener lumens de testnet (necesarios para deployar contratos)
# Opción 1: Usar el comando fund (si está disponible)
stellar keys fund test-account --network testnet

# Opción 2: Visita el faucet web
# https://laboratory.stellar.org/#account-creator?network=testnet
# O usa: https://developers.stellar.org/docs/encyclopedia/testnet-faucet
```

### Paso 3: Construir los contratos

```bash
cd contracts_winefi

# Construir todos los contratos
cargo build --target wasm32-unknown-unknown --release

# O construir contratos específicos
cargo build -p bottle-factory --target wasm32-unknown-unknown --release
cargo build -p traceability-log --target wasm32-unknown-unknown --release
cargo build -p transfer --target wasm32-unknown-unknown --release
```

### Paso 4: Desplegar contratos en Testnet

```bash
# Configurar variables de entorno para Testnet
export STELLAR_NETWORK=testnet
export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Establecer cuenta por defecto
stellar keys use test-account

# Desplegar BottleFactory
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bottle_factory.wasm \
  --source-account test-account \
  --network testnet

# Desplegar TraceabilityLog
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/traceability_log.wasm \
  --source-account test-account \
  --network testnet

# Desplegar Transfer
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/transfer.wasm \
  --source-account test-account \
  --network testnet
```

### Paso 5: Inicializar y probar los contratos

Ver el script `deploy_and_test.sh` para ejemplos completos.

## Opción 2: Stellar Local Devnet (Máximo control)

### Paso 1: Instalar Stellar Core y Horizon

```bash
# Usar Stellar Quickstart (Docker)
git clone https://github.com/stellar/docker-stellar-core-horizon.git
cd docker-stellar-core-horizon

# Iniciar red local
docker-compose up -d

# Esto creará:
# - Stellar Core en puerto 11626
# - Horizon API en puerto 8000
# - RPC de Soroban en puerto 8001 (probablemente)
```

### Paso 2: Configurar Stellar CLI para local

```bash
# Configurar variables de entorno para red local
export STELLAR_NETWORK=local
export STELLAR_RPC_URL=http://localhost:8001
export STELLAR_NETWORK_PASSPHRASE="Standalone Network ; February 2017 ; Stellar Standalone Network ; September 2015"
```

### Paso 3: Crear cuenta y fondearla

```bash
# Generar cuenta
stellar keys generate local-account

# Obtener la clave pública
stellar keys public-key local-account

# Establecer como cuenta por defecto
stellar keys use local-account

# Fondear la cuenta usando el friendbot local
ADDRESS=$(stellar keys public-key local-account)
curl "http://localhost:8000/friendbot?addr=$ADDRESS"
```

## Opción 3: Stellar Futurenet (Red de pruebas más avanzada)

```bash
# Configurar variables de entorno para Futurenet
export STELLAR_NETWORK=futurenet
export STELLAR_RPC_URL=https://rpc-futurenet.stellar.org
export STELLAR_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"

# Obtener lumens de Futurenet
# Opción 1: Usar el comando fund
stellar keys fund test-account --network futurenet

# Opción 2: Visita el faucet web
# https://laboratory.stellar.org/#account-creator?network=futurenet
```

## Comandos Útiles

```bash
# Ver variables de entorno de red actual
echo $STELLAR_NETWORK
echo $STELLAR_RPC_URL

# Listar identidades (cuentas)
stellar keys ls

# Ver información de una cuenta
stellar keys public-key test-account

# Verificar balance de cuenta (usando Horizon API)
curl "https://horizon-testnet.stellar.org/accounts/GXXXXXXXXXXXXX"

# Invocar función de contrato
stellar contract invoke \
  <CONTRACT_ID> \
  --function <FUNCTION_NAME> \
  --source-account <ACCOUNT> \
  --network <NETWORK> \
  -- \
  --arg1 value1 \
  --arg2 value2

# Ver información de un contrato
stellar contract info <CONTRACT_ID> --network <NETWORK>
```

## Solución de Problemas

### Error: "insufficient balance"
- Asegúrate de tener suficientes XLM en tu cuenta
- Para testnet, usa el faucet: https://laboratory.stellar.org/#account-creator?network=testnet

### Error: "contract not found"
- Verifica que el contrato esté desplegado: `soroban contract id <WASM_FILE>`
- Verifica que estés usando la red correcta: `soroban network show`

### Error: "transaction failed"
- Revisa los logs: agrega `--verbose` a los comandos
- Verifica que los contratos estén inicializados correctamente

## Próximos Pasos

1. Desplegar todos los contratos usando `deploy_and_test.sh`
2. Inicializar los contratos con las direcciones correctas
3. Ejecutar los tests unitarios: `cargo test`
4. Crear cuentas de prueba para diferentes actores (bodega, distribuidor, minorista)
5. Probar el flujo completo de trazabilidad
