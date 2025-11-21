#!/bin/bash

# Script para desplegar y probar los contratos de WineFi en Stellar Testnet
# Uso: ./deploy_and_test.sh <NETWORK> <ACCOUNT_NAME>
# Ejemplo: ./deploy_and_test.sh testnet test-account

set -e

NETWORK="${1:-testnet}"
ACCOUNT_NAME="${2:-test-account}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 WineFi Contract Deployment Script"
echo "====================================="
echo "Network: $NETWORK"
echo "Account: $ACCOUNT_NAME"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que stellar CLI esté instalado
if ! command -v stellar &> /dev/null; then
    echo -e "${RED}❌ Stellar CLI no está instalado${NC}"
    echo "Instala con: cargo install --locked stellar-cli"
    exit 1
fi

# Verificar que la cuenta exista
if ! stellar keys ls 2>/dev/null | grep -q "$ACCOUNT_NAME"; then
    echo -e "${YELLOW}⚠️  La cuenta '$ACCOUNT_NAME' no existe${NC}"
    echo "Creando nueva cuenta..."
    stellar keys generate "$ACCOUNT_NAME"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: La cuenta necesita estar fondeada en $NETWORK${NC}"
    if [ "$NETWORK" = "testnet" ]; then
        ADDRESS=$(stellar keys public-key "$ACCOUNT_NAME" 2>/dev/null | grep -oE 'G[A-Z0-9]{55}' || echo "")
        if [ -n "$ADDRESS" ]; then
            echo "Tu dirección: $ADDRESS"
            echo "Obtén lumens gratis en: https://laboratory.stellar.org/#account-creator?network=testnet"
            echo "O usa: stellar keys fund $ACCOUNT_NAME --network testnet"
        fi
    fi
fi

# Verificar que la cuenta esté fondeada (opcional, solo advierte)
if [ "$NETWORK" != "local" ]; then
    echo "Verificando balance de cuenta..."
    if ! stellar keys fund "$ACCOUNT_NAME" --network "$NETWORK" 2>&1 | grep -q "already funded\|funded\|Account"; then
        echo -e "${YELLOW}⚠️  Asegúrate de que tu cuenta esté fondeada en $NETWORK${NC}"
    fi
fi

# Configurar red según el nombre de red
case "$NETWORK" in
    testnet)
        export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
        export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
        ;;
    futurenet)
        export STELLAR_RPC_URL=https://rpc-futurenet.stellar.org
        export STELLAR_NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
        ;;
    mainnet)
        export STELLAR_RPC_URL=https://soroban-rpc.mainnet.stellar.org
        export STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
        ;;
    *)
        echo -e "${RED}❌ Red desconocida: $NETWORK${NC}"
        echo "Redes soportadas: testnet, futurenet, mainnet"
        exit 1
        ;;
esac

export STELLAR_NETWORK="$NETWORK"
stellar keys use "$ACCOUNT_NAME"
echo -e "${GREEN}✓ Red configurada a: $NETWORK${NC}"

# Construir contratos
echo ""
echo "📦 Construyendo contratos..."
cd "$SCRIPT_DIR"

cargo build --target wasm32-unknown-unknown --release

echo -e "${GREEN}✓ Contratos construidos${NC}"

# Función para desplegar contrato
deploy_contract() {
    local contract_name=$1
    local wasm_file=$2
    
    echo "" >&2
    echo "🚀 Desplegando $contract_name..." >&2
    
    if [ ! -f "$wasm_file" ]; then
        echo -e "${RED}❌ Archivo WASM no encontrado: $wasm_file${NC}" >&2
        return 1
    fi
    
    # Ejecutar deploy y capturar todo el output
    local deploy_output=$(stellar contract deploy \
        --wasm "$wasm_file" \
        --source-account "$ACCOUNT_NAME" \
        --network "$NETWORK" 2>&1)
    
    # Mostrar output (para que el usuario vea qué está pasando)
    echo "$deploy_output" >&2
    
    # Verificar si hubo errores críticos
    if echo "$deploy_output" | grep -qiE "error.*account not found|failed.*deploy"; then
        echo -e "${RED}❌ Error crítico desplegando $contract_name${NC}" >&2
        echo "   Asegúrate de que la cuenta esté fondeada en $NETWORK" >&2
        # No retornar error aquí, solo continuar para intentar extraer el ID
    fi
    
    # Extraer contract ID - buscar solo IDs válidos de 56 caracteres (Stellar addresses/IDs)
    local contract_id=$(echo "$deploy_output" | grep -oE '[A-Z0-9]{56}' | head -1 | tr -d '[:space:]\r\n')
    
    # Verificar que el ID tenga exactamente 56 caracteres
    if [ -z "$contract_id" ] || [ ${#contract_id} -ne 56 ]; then
        echo -e "${RED}❌ Error: No se pudo extraer un Contract ID válido para $contract_name${NC}" >&2
        return 1
    fi
    
    echo -e "${GREEN}✓ $contract_name desplegado${NC}" >&2
    echo "   Contract ID: $contract_id" >&2
    
    # Retornar SOLO el ID limpio en stdout (sin ningún otro texto)
    echo -n "$contract_id"
}

# Desplegar contratos
echo ""
echo "📝 Desplegando contratos..."

# Los archivos WASM se nombran reemplazando guiones con guiones bajos
# Usar un enfoque donde los logs se muestran y el ID se extrae del último stdout
BOTTLE_FACTORY_ID=$(deploy_contract "BottleFactory" \
    "target/wasm32-unknown-unknown/release/bottle_factory.wasm" 2>&1 | tail -1 | tr -d '[:space:]\r\n')

TRACEABILITY_LOG_ID=$(deploy_contract "TraceabilityLog" \
    "target/wasm32-unknown-unknown/release/traceability_log.wasm" 2>&1 | tail -1 | tr -d '[:space:]\r\n')

TRANSFER_ID=$(deploy_contract "Transfer" \
    "target/wasm32-unknown-unknown/release/transfer.wasm" 2>&1 | tail -1 | tr -d '[:space:]\r\n')

# Limpiar IDs una vez más para asegurar que solo tengan 56 caracteres
BOTTLE_FACTORY_ID=$(echo "$BOTTLE_FACTORY_ID" | grep -oE '[A-Z0-9]{56}' | head -1)
TRACEABILITY_LOG_ID=$(echo "$TRACEABILITY_LOG_ID" | grep -oE '[A-Z0-9]{56}' | head -1)
TRANSFER_ID=$(echo "$TRANSFER_ID" | grep -oE '[A-Z0-9]{56}' | head -1)

# Verificar que todos los IDs sean válidos
if [ -z "$BOTTLE_FACTORY_ID" ] || [ ${#BOTTLE_FACTORY_ID} -ne 56 ]; then
    echo -e "${RED}❌ Error: BottleFactory ID no válido${NC}"
    exit 1
fi

if [ -z "$TRACEABILITY_LOG_ID" ] || [ ${#TRACEABILITY_LOG_ID} -ne 56 ]; then
    echo -e "${RED}❌ Error: TraceabilityLog ID no válido${NC}"
    exit 1
fi

if [ -z "$TRANSFER_ID" ] || [ ${#TRANSFER_ID} -ne 56 ]; then
    echo -e "${RED}❌ Error: Transfer ID no válido${NC}"
    exit 1
fi

# Guardar IDs en archivo (solo si todos los IDs son válidos)
CONFIG_FILE="$SCRIPT_DIR/.deployed_contracts_${NETWORK}.env"

cat > "$CONFIG_FILE" << EOF
# Contract IDs deployed on $NETWORK
# Generated on $(date)

BOTTLE_FACTORY_ID=$BOTTLE_FACTORY_ID
TRACEABILITY_LOG_ID=$TRACEABILITY_LOG_ID
TRANSFER_ID=$TRANSFER_ID

# Network configuration
NETWORK=$NETWORK
ACCOUNT_NAME=$ACCOUNT_NAME
EOF

echo ""
echo -e "${GREEN}✓ IDs de contratos guardados en: $CONFIG_FILE${NC}"

# Inicializar Transfer contract
echo ""
echo "🔧 Inicializando contrato Transfer..."

if stellar contract invoke \
    "$TRANSFER_ID" \
    --function init \
    --source-account "$ACCOUNT_NAME" \
    --network "$NETWORK" \
    -- \
    --bottle_factory "$BOTTLE_FACTORY_ID" \
    --traceability_log "$TRACEABILITY_LOG_ID" 2>&1; then
    echo -e "${GREEN}✓ Transfer inicializado${NC}"
else
    echo -e "${YELLOW}⚠️  Error inicializando Transfer. Puede que ya esté inicializado o haya un problema con la cuenta.${NC}"
    echo "Puedes intentarlo manualmente más tarde."
fi

# Mostrar resumen
echo ""
echo "====================================="
echo -e "${GREEN}✅ Despliegue Completado${NC}"
echo "====================================="
echo "Contract IDs:"
echo "  BottleFactory:    $BOTTLE_FACTORY_ID"
echo "  TraceabilityLog:  $TRACEABILITY_LOG_ID"
echo "  Transfer:         $TRANSFER_ID"
echo ""
echo "📋 Configuración guardada en: $CONFIG_FILE"
echo ""
echo "🧪 Prueba los contratos:"
echo ""
echo "# Mint una botella:"
echo "stellar contract invoke \\"
echo "  $BOTTLE_FACTORY_ID \\"
echo "  --function mint_bottle \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network $NETWORK \\"
echo "  -- \\"
echo "  --lot_id \"MALBEC-2024-001\" \\"
echo "  --bottle_number 1 \\"
echo "  --winery \$(stellar keys public-key $ACCOUNT_NAME) \\"
echo "  --wine_name \"Gran Reserva Malbec\" \\"
echo "  --vintage 2024 \\"
echo "  --metadata_uri \"ipfs://QmTest123\""
echo ""
echo "# Consultar botella:"
echo "stellar contract invoke \\"
echo "  $BOTTLE_FACTORY_ID \\"
echo "  --function get_bottle \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network $NETWORK \\"
echo "  -- \\"
echo "  --bottle_id \"MALBEC-2024-001-0001\""
