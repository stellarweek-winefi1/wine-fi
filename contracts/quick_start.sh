#!/bin/bash

# Script rápido para configurar Stellar Testnet y probar los contratos

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🍷 WineFi - Quick Start para Stellar Testnet${NC}"
echo "=========================================="
echo ""

# Verificar Stellar CLI
if ! command -v stellar &> /dev/null; then
    echo -e "${YELLOW}⚠️  Stellar CLI no está instalado${NC}"
    echo ""
    echo "Instalando Stellar CLI..."
    echo "Opciones de instalación:"
    echo "  1. Con cargo: cargo install --locked stellar-cli"
    echo "  2. Visita: https://github.com/stellar/stellar-cli"
    echo ""
    read -p "¿Deseas instalar ahora con cargo? (s/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        cargo install --locked stellar-cli
    else
        echo "Por favor instala Stellar CLI manualmente y vuelve a ejecutar este script"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Stellar CLI instalado${NC}"
stellar --version
echo ""

# Configurar variables de red para Testnet
export STELLAR_NETWORK=testnet
export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
export STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

echo "🌐 Configurando Stellar Testnet..."
echo -e "${GREEN}✓ Testnet configurado (usando variables de entorno)${NC}"
echo ""

# Crear o usar cuenta
ACCOUNT_NAME="winefi-dev"
echo "👤 Configurando cuenta: $ACCOUNT_NAME"

if ! stellar keys ls 2>/dev/null | grep -q "$ACCOUNT_NAME"; then
    echo "Generando nueva cuenta..."
    stellar keys generate "$ACCOUNT_NAME"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANTE: Necesitas fondear tu cuenta con lumens de testnet${NC}"
    echo ""
    ADDRESS=$(stellar keys public-key "$ACCOUNT_NAME" 2>/dev/null || stellar keys address "$ACCOUNT_NAME" 2>/dev/null | grep -o 'G[A-Z0-9]\{55\}')
    echo "Tu dirección: $ADDRESS"
    echo ""
    echo "Obtén lumens gratis en:"
    echo "  https://laboratory.stellar.org/#account-creator?network=testnet"
    echo ""
    echo "O usa el comando:"
    echo "  stellar keys fund $ACCOUNT_NAME --network testnet"
    echo ""
    read -p "Presiona Enter cuando hayas fondado tu cuenta..."
else
    echo -e "${GREEN}✓ Usando cuenta existente${NC}"
    ADDRESS=$(stellar keys public-key "$ACCOUNT_NAME" 2>/dev/null || stellar keys address "$ACCOUNT_NAME" 2>/dev/null | grep -o 'G[A-Z0-9]\{55\}')
    echo "Dirección: $ADDRESS"
fi

# Establecer cuenta por defecto
stellar keys use "$ACCOUNT_NAME"

echo ""

# Construir contratos
echo "🔨 Construyendo contratos..."
cd "$(dirname "$0")"
cargo build --target wasm32-unknown-unknown --release

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error construyendo contratos${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Contratos construidos${NC}"
echo ""

# Desplegar usando el script principal
echo "🚀 Desplegando contratos..."
./deploy_and_test.sh testnet "$ACCOUNT_NAME"

echo ""
echo -e "${GREEN}✅ ¡Configuración completada!${NC}"
echo ""
echo "📝 Próximos pasos:"
echo "  1. Revisa el archivo .deployed_contracts_testnet.env para los IDs de contratos"
echo "  2. Ejecuta los tests: cargo test"
echo "  3. Prueba invocar funciones usando los ejemplos en SETUP_DEVNET.md"
