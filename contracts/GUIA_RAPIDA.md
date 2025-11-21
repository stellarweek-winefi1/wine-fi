# 🚀 Guía Rápida: Stellar Devnet y Pruebas de Contratos

Esta guía te ayudará a configurar rápidamente una devnet de Stellar y probar tus contratos de WineFi.

## Opción 1: Inicio Automático (Recomendado)

```bash
cd contracts_winefi
./quick_start.sh
```

Este script:
- ✅ Verifica si Stellar CLI está instalado
- ✅ Configura Stellar Testnet
- ✅ Crea una cuenta de prueba
- ✅ Construye los contratos
- ✅ Despliega todos los contratos

## Opción 2: Manual Paso a Paso

### 1. Instalar Stellar CLI

```bash
cargo install --locked stellar-cli

# Verificar instalación
stellar --version
```

### 2. Configurar Stellar Testnet

```bash
# Configurar variables de entorno para Testnet
export STELLAR_NETWORK=testnet
export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

### 3. Crear y Fondear Cuenta

```bash
# Generar nueva cuenta
stellar keys generate winefi-dev

# Ver tu dirección
stellar keys public-key winefi-dev

# Establecer como cuenta por defecto
stellar keys use winefi-dev

# Obtener lumens gratis de testnet
# Opción 1: Usar el comando fund (si está disponible)
stellar keys fund winefi-dev --network testnet

# Opción 2: Visita el faucet web
# https://laboratory.stellar.org/#account-creator?network=testnet

# Opción 3: Usa friendbot
ADDRESS=$(stellar keys public-key winefi-dev)
curl "https://friendbot.stellar.org/?addr=$ADDRESS"
```

### 4. Construir Contratos

```bash
cd contracts_winefi

# Construir todos los contratos
cargo build --target wasm32-unknown-unknown --release

# O construir individualmente
cargo build -p bottle-factory --target wasm32-unknown-unknown --release
cargo build -p traceability-log --target wasm32-unknown-unknown --release
cargo build -p transfer --target wasm32-unknown-unknown --release
```

### 5. Desplegar Contratos

```bash
# Opción A: Usar el script automático
./deploy_and_test.sh testnet winefi-dev

# Opción B: Desplegar manualmente
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/bottle_factory.wasm \
  --source-account winefi-dev \
  --network testnet

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/traceability_log.wasm \
  --source-account winefi-dev \
  --network testnet

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/transfer.wasm \
  --source-account winefi-dev \
  --network testnet
```

### 6. Inicializar Contrato Transfer

Después de desplegar, necesitas inicializar el contrato Transfer con las direcciones de BottleFactory y TraceabilityLog:

```bash
# Obtener las direcciones de los contratos desplegados (guárdalas)
BOTTLE_FACTORY_ID="CAXXXX..."
TRACEABILITY_LOG_ID="CAYYYY..."
TRANSFER_ID="CAZZZZ..."

# Inicializar Transfer
stellar contract invoke \
  $TRANSFER_ID \
  --function init \
  --source-account winefi-dev \
  --network testnet \
  -- \
  --bottle_factory $BOTTLE_FACTORY_ID \
  --traceability_log $TRACEABILITY_LOG_ID
```

## Ejemplos de Uso

### Mint una Botella

```bash
# Primero obtén tu dirección
WINERY_ADDRESS=$(stellar keys public-key winefi-dev)

stellar contract invoke \
  $BOTTLE_FACTORY_ID \
  --function mint_bottle \
  --source-account winefi-dev \
  --network testnet \
  -- \
  --lot_id "MALBEC-2024-001" \
  --bottle_number 1 \
  --winery $WINERY_ADDRESS \
  --wine_name "Gran Reserva Malbec" \
  --vintage 2024 \
  --metadata_uri "ipfs://QmTest123"
```

### Consultar Botella

```bash
stellar contract invoke \
  $BOTTLE_FACTORY_ID \
  --function get_bottle \
  --source-account winefi-dev \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001"
```

### Registrar Evento de Trazabilidad

```bash
ACTOR_ADDRESS=$(stellar keys public-key winefi-dev)

stellar contract invoke \
  $TRACEABILITY_LOG_ID \
  --function log_event \
  --source-account winefi-dev \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001" \
  --event_type Bottling \
  --actor $ACTOR_ADDRESS \
  --description "Bottled at winery"
```

### Obtener Historial de Eventos

```bash
stellar contract invoke \
  $TRACEABILITY_LOG_ID \
  --function get_history \
  --source-account winefi-dev \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001"
```

### Transferir Propiedad

```bash
NEW_OWNER="GDXXXX..."  # Dirección del nuevo propietario

stellar contract invoke \
  $TRANSFER_ID \
  --function transfer \
  --source-account winefi-dev \
  --network testnet \
  -- \
  --bottle_id "MALBEC-2024-001-0001" \
  --to $NEW_OWNER
```

## Archivos de Configuración

Después de desplegar, el script crea un archivo `.deployed_contracts_testnet.env` con los IDs de los contratos:

```bash
# Contract IDs deployed on testnet
BOTTLE_FACTORY_ID=CAXXXX...
TRACEABILITY_LOG_ID=CAYYYY...
TRANSFER_ID=CAZZZZ...

# Network configuration
NETWORK=testnet
ACCOUNT_NAME=winefi-dev
```

Puedes cargar estos valores en tu shell:

```bash
source .deployed_contracts_testnet.env
```

## Ejecutar Tests Unitarios

```bash
# Tests para todos los contratos
cargo test

# Tests específicos
cargo test -p bottle-factory
cargo test -p traceability-log
cargo test -p transfer
```

## Recursos Útiles

- **Stellar Laboratory**: https://laboratory.stellar.org
- **Soroban Docs**: https://soroban.stellar.org/docs
- **Testnet Faucet**: https://laboratory.stellar.org/#account-creator?network=testnet
- **Stellar Testnet Explorer**: https://stellar.expert/explorer/testnet

## Solución de Problemas

### Error: "insufficient balance"
- Asegúrate de tener suficientes XLM en tu cuenta de testnet
- Obtén más lumens en: https://laboratory.stellar.org/#account-creator?network=testnet

### Error: "contract not found"
- Verifica que el contrato esté desplegado: revisa `.deployed_contracts_testnet.env`
- Verifica que estés usando la red correcta: `echo $STELLAR_NETWORK`

### Error: "transaction failed"
- Revisa los logs: agrega `--verbose` a los comandos
- Verifica que los contratos estén inicializados correctamente

---

Para más detalles, consulta `SETUP_DEVNET.md` para una guía completa.
