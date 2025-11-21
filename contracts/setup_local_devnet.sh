#!/bin/bash

# Script para configurar una devnet local de Stellar y probar los contratos
# Este script configura una red local completa sin necesidad de testnet

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🍷 WineFi - Setup Local Stellar Devnet${NC}"
echo "=============================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar Rust y Cargo
if ! command -v rustc &> /dev/null || ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Rust y Cargo no están instalados${NC}"
    echo ""
    echo "Por favor instala Rust primero:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    exit 1
fi

if ! command -v rustup &> /dev/null; then
    echo -e "${YELLOW}⚠️  rustup no está instalado${NC}"
    echo "Necesitas rustup para instalar targets. Instala Rust completamente."
    exit 1
fi

echo -e "${GREEN}✓ Rust y Cargo encontrados${NC}"
rustc --version
cargo --version
echo ""

# Verificar Stellar CLI
if ! command -v stellar &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stellar CLI no está instalado${NC}"
    echo ""
    echo "Instalando Stellar CLI..."
    read -p "¿Deseas instalar ahora con cargo? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        cargo install --locked stellar-cli
    else
        echo "Por favor instala Stellar CLI manualmente: cargo install --locked stellar-cli"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Stellar CLI instalado${NC}"
stellar --version
echo ""

# Verificar Docker
USE_QUICKSTART=false

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker no está instalado${NC}"
    echo ""
    echo "Para usar una devnet local, necesitas Docker instalado."
    echo "Opción 1: Instalar Docker"
    echo "Opción 2: Usar stellar-quickstart (si está disponible)"
    echo ""
    read -p "¿Quieres usar stellar-quickstart sin Docker? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        USE_QUICKSTART=true
    else
        echo "Instala Docker y vuelve a ejecutar este script"
        exit 1
    fi
else
    # Verificar que docker compose funcione
    if docker compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker encontrado (docker compose disponible)${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker está instalado pero 'docker compose' no está disponible${NC}"
        echo "Intentando usar stellar-quickstart..."
        USE_QUICKSTART=true
    fi
fi

echo ""
echo "🌐 Configurando devnet local..."

# Configurar variables de entorno para red local
export STELLAR_NETWORK=local
export STELLAR_RPC_URL=http://localhost:8000/rpc
export STELLAR_NETWORK_PASSPHRASE="Standalone Network ; February 2017 ; Stellar Standalone Network ; September 2015"
export STELLAR_HORIZON_URL=http://localhost:8000

# Función para iniciar servicios con Docker
start_local_services() {
    echo ""
    echo "🐳 Iniciando servicios locales con Docker..."
    
    # Crear docker-compose.yml si no existe
    if [ ! -f "$SCRIPT_DIR/docker-compose.local.yml" ]; then
        cat > "$SCRIPT_DIR/docker-compose.local.yml" << 'EOF'
services:
  stellar:
    image: stellar/quickstart:testing
    container_name: stellar-local-core
    ports:
      - "11626:11626"  # Stellar Core
      - "8000:8000"    # Horizon API / Soroban RPC
    command: ["--standalone"]
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 60s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
EOF
        echo -e "${GREEN}✓ Archivo docker-compose.local.yml creado${NC}"
    fi
    
    # Iniciar servicios
    cd "$SCRIPT_DIR"
    
    # Limpiar contenedores existentes primero
    echo "🧹 Limpiando contenedores existentes..."
    
    # Detener y eliminar contenedor existente si existe
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^stellar-local-core$"; then
        echo "Deteniendo contenedor anterior..."
        docker stop stellar-local-core 2>/dev/null || true
        docker rm stellar-local-core 2>/dev/null || true
        echo -e "${GREEN}✓ Contenedor anterior eliminado${NC}"
    fi
    
    # Limpiar usando docker compose si hay algo corriendo
    if docker compose -f docker-compose.local.yml ps 2>/dev/null | grep -qE "(Up|running|created|exited)"; then
        echo "Limpiando servicios docker compose existentes..."
        docker compose -f docker-compose.local.yml down --remove-orphans 2>/dev/null || true
        echo -e "${GREEN}✓ Servicios anteriores limpiados${NC}"
    fi
    
    echo ""
    echo "Iniciando servicios Docker..."
    docker compose -f docker-compose.local.yml up -d --remove-orphans
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error iniciando servicios Docker${NC}"
        echo ""
        echo "Intentando limpiar completamente y volver a intentar..."
        docker compose -f docker-compose.local.yml down --remove-orphans 2>/dev/null || true
        docker rm -f stellar-local-core 2>/dev/null || true
        sleep 2
        echo "Reintentando..."
        docker compose -f docker-compose.local.yml up -d --remove-orphans
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Error persistente al iniciar servicios Docker${NC}"
            echo "Asegúrate de que Docker esté corriendo y que tengas permisos"
            echo "Verifica los logs: docker compose -f $SCRIPT_DIR/docker-compose.local.yml logs"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✓ Servicios Docker iniciados${NC}"
    
    echo "Esperando a que los servicios se inicien..."
    sleep 10
    
    # Verificar estado del contenedor
    echo "Verificando estado del contenedor..."
    sleep 3
    
    # Verificar que el contenedor esté corriendo
    if docker ps | grep -q "stellar-local-core"; then
        CONTAINER_STATUS=$(docker inspect stellar-local-core --format='{{.State.Status}}' 2>/dev/null || echo "unknown")
        echo "Estado del contenedor: $CONTAINER_STATUS"
        
        if [ "$CONTAINER_STATUS" != "running" ]; then
            echo -e "${YELLOW}⚠️  El contenedor no está corriendo (estado: $CONTAINER_STATUS)${NC}"
            echo "Mostrando logs recientes..."
            docker compose -f docker-compose.local.yml logs --tail=50
            echo ""
            echo "Para ver todos los logs, ejecuta:"
            echo "  docker compose -f $SCRIPT_DIR/docker-compose.local.yml logs -f"
        fi
    else
        echo -e "${YELLOW}⚠️  El contenedor no se encontró${NC}"
        echo "Mostrando logs del intento de inicio..."
        docker compose -f docker-compose.local.yml logs 2>&1 | tail -50
    fi
    
    # Esperar a que RPC/API esté disponible
    echo ""
    echo "Esperando a que RPC/API esté disponible..."
    echo "Esto puede tomar hasta 60 segundos..."
    max_attempts=60
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        # Verificar que el contenedor esté corriendo
        if ! docker compose -f docker-compose.local.yml ps | grep -qE "(Up|running)"; then
            echo -e "${RED}❌ El contenedor se detuvo${NC}"
            echo "Mostrando logs del contenedor:"
            docker compose -f docker-compose.local.yml logs --tail=50
            exit 1
        fi
        
        # Intentar conectar a RPC endpoint
        if curl -s -f http://localhost:8000/rpc > /dev/null 2>&1 || \
           curl -s http://localhost:8000/ 2>&1 | grep -qE "(horizon|stellar|rpc)" || \
           curl -s -f http://localhost:8000 > /dev/null 2>&1; then
            echo -e "${GREEN}✓ RPC/API está disponible${NC}"
            break
        fi
        
        attempt=$((attempt + 1))
        if [ $((attempt % 5)) -eq 0 ]; then
            echo "Intentando conectar... ($attempt/$max_attempts)"
            # Mostrar última línea de logs cada 10 intentos
            if [ $((attempt % 10)) -eq 0 ]; then
                echo "  Última línea de logs:"
                docker compose -f docker-compose.local.yml logs --tail=1 2>&1 | tail -1
            fi
        fi
        sleep 1
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "${RED}❌ No se pudo conectar a RPC/API después de $max_attempts intentos${NC}"
        echo ""
        echo "Estado del contenedor:"
        docker compose -f docker-compose.local.yml ps
        echo ""
        echo "Últimas 30 líneas de logs:"
        docker compose -f docker-compose.local.yml logs --tail=30
        echo ""
        echo "Para ver más logs, ejecuta:"
        echo "  docker compose -f $SCRIPT_DIR/docker-compose.local.yml logs -f"
        exit 1
    fi
}

# Función para usar stellar-quickstart (alternativa)
start_quickstart() {
    echo ""
    echo "🚀 Intentando usar stellar-quickstart..."
    
    if command -v stellar-quickstart &> /dev/null; then
        echo "Ejecutando stellar-quickstart..."
        stellar-quickstart --enable-soroban
    else
        echo -e "${YELLOW}⚠️  stellar-quickstart no está disponible${NC}"
        echo "Instalando stellar-quickstart..."
        cargo install --git https://github.com/stellar/stellar-quickstart.git stellar-quickstart
        stellar-quickstart --enable-soroban
    fi
}

# Iniciar servicios según la opción elegida
if [ "$USE_QUICKSTART" = true ]; then
    start_quickstart
else
    start_local_services
fi

echo ""
echo -e "${GREEN}✓ Servicios locales iniciados${NC}"
echo "  - Horizon API: http://localhost:8000"
echo "  - Soroban RPC: http://localhost:8000/rpc"
echo "  - Stellar Core: localhost:11626"
echo ""

# Crear o usar cuenta
ACCOUNT_NAME="winefi-local"
echo "👤 Configurando cuenta: $ACCOUNT_NAME"

if ! stellar keys ls 2>/dev/null | grep -q "$ACCOUNT_NAME"; then
    echo "Generando nueva cuenta..."
    stellar keys generate "$ACCOUNT_NAME"
    echo -e "${GREEN}✓ Cuenta generada${NC}"
else
    echo -e "${GREEN}✓ Usando cuenta existente${NC}"
fi

# Obtener dirección
ADDRESS=$(stellar keys public-key "$ACCOUNT_NAME" 2>/dev/null || stellar keys address "$ACCOUNT_NAME" 2>/dev/null | grep -oE 'G[A-Z0-9]{55}')

if [ -z "$ADDRESS" ]; then
    ADDRESS=$(stellar keys public-key "$ACCOUNT_NAME" 2>&1 | grep -oE 'G[A-Z0-9]{55}')
fi

echo "Dirección: $ADDRESS"
echo ""

# Fondear cuenta usando friendbot local
echo "💰 Fondeando cuenta con lumens..."

# Intentar fondear con friendbot local
MAX_ATTEMPTS=10
ATTEMPT=0
FUNDED=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s "http://localhost:8000/friendbot?addr=$ADDRESS" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Cuenta fondeada exitosamente${NC}"
        FUNDED=true
        break
    fi
    
    # Alternativa: usar stellar keys fund si está disponible
    if stellar keys fund "$ACCOUNT_NAME" --network local 2>/dev/null; then
        echo -e "${GREEN}✓ Cuenta fondeada exitosamente${NC}"
        FUNDED=true
        break
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo "Esperando que friendbot esté disponible... ($ATTEMPT/$MAX_ATTEMPTS)"
    sleep 2
done

if [ "$FUNDED" = false ]; then
    echo -e "${YELLOW}⚠️  No se pudo fondear automáticamente${NC}"
    echo "Puedes fondear manualmente visitando: http://localhost:8000/friendbot?addr=$ADDRESS"
    read -p "Presiona Enter cuando hayas fondado la cuenta o cuando quieras continuar..."
fi

# Establecer cuenta por defecto
stellar keys use "$ACCOUNT_NAME"
echo -e "${GREEN}✓ Cuenta configurada como predeterminada${NC}"
echo ""

# Construir contratos
echo "🔨 Construyendo contratos..."
cd "$SCRIPT_DIR"

# Verificar e instalar el target wasm32-unknown-unknown si es necesario
if ! rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    echo "Instalando target wasm32-unknown-unknown..."
    rustup target add wasm32-unknown-unknown
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando target wasm32-unknown-unknown${NC}"
        echo "Instala manualmente con: rustup target add wasm32-unknown-unknown"
        exit 1
    fi
    echo -e "${GREEN}✓ Target wasm32-unknown-unknown instalado${NC}"
fi

echo "Compilando contratos..."
if cargo build --target wasm32-unknown-unknown --release 2>&1; then
    echo -e "${GREEN}✓ Contratos construidos${NC}"
else
    echo -e "${RED}❌ Error construyendo contratos${NC}"
    echo ""
    echo "Si el error persiste, verifica que Rust esté instalado correctamente:"
    echo "  rustc --version"
    echo "  cargo --version"
    echo ""
    echo "Y asegúrate de tener el target instalado:"
    echo "  rustup target add wasm32-unknown-unknown"
    exit 1
fi

echo ""

# Desplegar contratos
echo "🚀 Desplegando contratos en devnet local..."
echo ""

# Función para desplegar contrato
deploy_contract() {
    local contract_name=$1
    local wasm_file=$2
    
    echo "📦 Desplegando $contract_name..."
    
    if [ ! -f "$wasm_file" ]; then
        echo -e "${RED}❌ Archivo WASM no encontrado: $wasm_file${NC}"
        return 1
    fi
    
    local deploy_output=$(stellar contract deploy \
        --wasm "$wasm_file" \
        --source-account "$ACCOUNT_NAME" \
        --network local \
        --rpc-url "$STELLAR_RPC_URL" \
        --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" 2>&1)
    
    echo "$deploy_output"
    
    # Extraer contract ID
    local contract_id=$(echo "$deploy_output" | grep -i -oE '(contract id:|contract_id:|Contract ID:)\s*[A-Z0-9]{56}' | grep -oE '[A-Z0-9]{56}' | head -1)
    
    if [ -z "$contract_id" ]; then
        contract_id=$(echo "$deploy_output" | grep -oE '[A-Z0-9]{56}' | head -1)
    fi
    
    if [ -z "$contract_id" ]; then
        echo -e "${RED}❌ Error: No se pudo extraer el Contract ID${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ $contract_name desplegado${NC}"
    echo "   Contract ID: $contract_id"
    echo "$contract_id"
}

# Desplegar contratos
BOTTLE_FACTORY_ID=$(deploy_contract "BottleFactory" \
    "target/wasm32-unknown-unknown/release/bottle_factory.wasm")

echo ""

TRACEABILITY_LOG_ID=$(deploy_contract "TraceabilityLog" \
    "target/wasm32-unknown-unknown/release/traceability_log.wasm")

echo ""

TRANSFER_ID=$(deploy_contract "Transfer" \
    "target/wasm32-unknown-unknown/release/transfer.wasm")

echo ""

# Guardar IDs en archivo
CONFIG_FILE="$SCRIPT_DIR/.deployed_contracts_local.env"
cat > "$CONFIG_FILE" << EOF
# Contract IDs deployed on local devnet
# Generated on $(date)

BOTTLE_FACTORY_ID=$BOTTLE_FACTORY_ID
TRACEABILITY_LOG_ID=$TRACEABILITY_LOG_ID
TRANSFER_ID=$TRANSFER_ID

# Network configuration
NETWORK=local
ACCOUNT_NAME=$ACCOUNT_NAME
STELLAR_RPC_URL=$STELLAR_RPC_URL
STELLAR_NETWORK_PASSPHRASE="$STELLAR_NETWORK_PASSPHRASE"
STELLAR_HORIZON_URL=$STELLAR_HORIZON_URL
EOF

echo -e "${GREEN}✓ IDs de contratos guardados en: $CONFIG_FILE${NC}"

# Inicializar Transfer contract
echo ""
echo "🔧 Inicializando contrato Transfer..."

if stellar contract invoke \
    "$TRANSFER_ID" \
    --function init \
    --source-account "$ACCOUNT_NAME" \
    --network local \
    --rpc-url "$STELLAR_RPC_URL" \
    --network-passphrase "$STELLAR_NETWORK_PASSPHRASE" \
    -- \
    --bottle_factory "$BOTTLE_FACTORY_ID" \
    --traceability_log "$TRACEABILITY_LOG_ID" 2>&1; then
    
    echo -e "${GREEN}✓ Transfer inicializado${NC}"
else
    echo -e "${YELLOW}⚠️  Error inicializando Transfer, pero puedes intentarlo manualmente${NC}"
fi

# Mostrar resumen
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Devnet Local Configurada Exitosamente${NC}"
echo "=============================================="
echo ""
echo "Contract IDs:"
echo "  BottleFactory:    $BOTTLE_FACTORY_ID"
echo "  TraceabilityLog:  $TRACEABILITY_LOG_ID"
echo "  Transfer:         $TRANSFER_ID"
echo ""
echo "📋 Configuración guardada en: $CONFIG_FILE"
echo ""
echo "🔧 Comandos útiles:"
echo ""
echo "# Detener servicios Docker:"
echo "  docker compose -f $SCRIPT_DIR/docker-compose.local.yml down"
echo "  # O directamente:"
echo "  docker stop stellar-local-core && docker rm stellar-local-core"
echo ""
echo "# Ver logs de servicios:"
echo "  docker compose -f $SCRIPT_DIR/docker-compose.local.yml logs -f"
echo "  # O directamente:"
echo "  docker logs -f stellar-local-core"
echo ""
echo "# Cargar configuración:"
echo "  source $CONFIG_FILE"
echo ""
echo "🧪 Probar los contratos:"
echo ""
echo "# Mint una botella:"
echo "stellar contract invoke \\"
echo "  $BOTTLE_FACTORY_ID \\"
echo "  --function mint_bottle \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network local \\"
echo "  --rpc-url $STELLAR_RPC_URL \\"
echo "  --network-passphrase \"$STELLAR_NETWORK_PASSPHRASE\" \\"
echo "  -- \\"
echo "  --lot_id \"MALBEC-2024-001\" \\"
echo "  --bottle_number 1 \\"
echo "  --winery $ADDRESS \\"
echo "  --wine_name \"Gran Reserva Malbec\" \\"
echo "  --vintage 2024 \\"
echo "  --metadata_uri \"ipfs://QmTest123\""
echo ""
echo "# Consultar botella:"
echo "stellar contract invoke \\"
echo "  $BOTTLE_FACTORY_ID \\"
echo "  --function get_bottle \\"
echo "  --source-account $ACCOUNT_NAME \\"
echo "  --network local \\"
echo "  --rpc-url $STELLAR_RPC_URL \\"
echo "  --network-passphrase \"$STELLAR_NETWORK_PASSPHRASE\" \\"
echo "  -- \\"
echo "  --bottle_id \"MALBEC-2024-001-0001\""
