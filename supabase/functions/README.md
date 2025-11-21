# Supabase Edge Functions for Wine Traceability

This directory now hosts the backend services for the premium wine traceability MVP. Each function focuses on minting bottles as NFTs on Soroban, logging supply-chain events, updating ownership, and exposing read APIs for QR scans. Custodial wallets remain available for zero-friction logins, while the previous investment/tokenization endpoints have been removed.

## Traceability Functions

1. **mint-bottle** – Creates a bottle NFT via the `BottleFactory` contract and persists metadata/QR mapping in Supabase.
2. **log-event** – Records `Bottling`, `Shipped`, `Received`, or `Scanned` events via the `TraceabilityLog` contract and DB.
3. **transfer-bottle** – Verifies current ownership, executes the on-chain transfer, and logs shipment events.
4. **get-bottle-traceability** – Public endpoint used by QR scanners to fetch bottle metadata + full history.
5. **list-bottles** – Filters bottles by lot, winery, or owner; returns latest event snapshot for dashboards.

## Custodial Wallet Functions

6. **wallets-provision** – Authenticated endpoint that provisions an “invisible” Stellar wallet for a Supabase user.
7. **wallets-default** – Returns the caller’s wallet (auto-creates if missing) for seamless FE initialization.
8. **wallets-sign-payment** – Rate-limited signer that submits payments or returns signed XDRs from the custodial wallet.

## Deprecated Functions (Removed)

The family of tokenization endpoints has been deleted to avoid confusion:
- ~~**prepare-token**~~ – superseded by `mint-bottle`.
- ~~**status**~~ – replaced by `get-bottle-traceability`.
- ~~**emission-xdr**~~ – no longer needed.
- ~~**submit-signed**~~ – no longer needed.
- ~~**distribute**~~ – no longer needed.
- ~~**list-distributed-tokens**~~ – superseded by `list-bottles`.
- ~~**create-reward**~~ – legacy rewards, removed.

## Setup

### 1. Environment Variables

**Variables REQUERIDAS** (las provee Supabase automáticamente):
```bash
SUPABASE_URL=...                # Automático
SUPABASE_SERVICE_ROLE_KEY=...   # Automático
```

**Variables OPCIONALES pero RECOMENDADAS**:
```bash
# Stellar Network
STELLAR_NETWORK=TESTNET         # Usa PUBLIC en producción
# (HORIZON_URL se setea solo, puedes override)
# HORIZON_URL=https://horizon-testnet.stellar.org
# Soroban RPC (opcional, auto-default segun red)
# SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Custodial wallet crypto
ENCRYPTION_KEY=<openssl rand -base64 32>   # Obligatoria si usas wallets

# Rate limits (tienen defaults)
WALLET_SIGN_LIMIT_PER_MIN=5
WALLET_SIGN_LIMIT_PER_HOUR=50
```

**Variables para FUTURO (cuando subas los contratos a la red):**
```bash
BOTTLE_FACTORY_ADDRESS=CA...
TRACEABILITY_LOG_ADDRESS=CA...
TRANSFER_ADDRESS=CA...
```

**Opcionales (solo si usas estas features):**
```bash
PLATFORM_FUNDING_SECRET_KEY=S...
PLATFORM_STORAGE_BUCKET=wine-lots
SUPABASE_WINE_STORAGE_URL=https://...
```

**Resumen mínimo:** configura `ENCRYPTION_KEY` y (opcionalmente) `STELLAR_NETWORK`.

### 2. Database Setup

Ejecuta las migraciones en `supabase/migrations/`:

**Traceability tables**
- `bottles`
- `traceability_events`
- `qr_code_mapping`
- `wine_lots` (simplificado para agrupar botellas)

**Views**
- `bottle_traceability_view` – consulta rápida para `get-bottle-traceability`

**Custodial wallet tables**
- `user_wallets`
- `wallet_activity_logs`

*(Las tablas antiguas `wine_token_issuances`, `wine_distributions`, etc. se mantienen solo para compatibilidad, pero ya no se consumen.)*

### 3. Deploy Functions

```bash
# Traceability
supabase functions deploy mint-bottle
supabase functions deploy log-event
supabase functions deploy transfer-bottle
supabase functions deploy get-bottle-traceability
supabase functions deploy list-bottles

# Custodial wallet suite
supabase functions deploy wallets-provision
supabase functions deploy wallets-default
supabase functions deploy wallets-sign-payment
```

### 4. Set Environment Variables in Supabase Dashboard

1. Entra a https://app.supabase.com → tu proyecto.  
2. Project Settings → Edge Functions → Secrets.  
3. Agrega al menos:
   ```bash
   ENCRYPTION_KEY=<openssl rand -base64 32>
   STELLAR_NETWORK=TESTNET
   ```
4. Usa `openssl rand -base64 32` para generar el valor y pégalo tal cual.
5. `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están cargadas automáticamente.

## Traceability Function Details

### mint-bottle
**Endpoint:** `POST /functions/v1/mint-bottle` *(auth requerida)*  
**Flujo:** valida payload → genera `bottle_id` (`{lotId}-{serial}`) → crea registro en `bottles` + `qr_code_mapping` → invoca `BottleFactory` con la wallet invisible del usuario → registra evento `Bottling` con el hash on-chain.  
**Request mínimo:**
```json
{
  "lotId": "MALBEC-2024-001",
  "bottleNumber": 1,
  "wineName": "Gran Reserva Malbec",
  "vintage": 2024,
  "metadataUri": "ipfs://Qm...",
  "qrCode": "QR-MALBEC-2024-001-0001"
}
```

### log-event
**Endpoint:** `POST /functions/v1/log-event`  
Soporta eventos `bottling | shipped | received | scanned`. Eventos operativos requieren JWT; `scanned` puede marcar `skipAuth` para QR públicos.  
Actualiza `traceability_events`, bumpéa `current_owner_address` en `received` y firma en el contrato `TraceabilityLog` usando la custodial wallet del actor.

### transfer-bottle
**Endpoint:** `POST /functions/v1/transfer-bottle`  
Verifica que el usuario autenticado sea el owner actual. Ejecuta transferencia en el contrato `Transfer`, actualiza `bottles.current_owner_address` y auto registra `Shipped`. Pide `toAddress`, `description` opcional.

### get-bottle-traceability
**Endpoint:** `GET /functions/v1/get-bottle-traceability?bottleId=...` o `?qrCode=...` *(público)*  
Devuelve:  
```json
{
  "bottle": { ... },
  "events": [ ... ],
  "eventCount": 4
}
```
Si llega vía QR, inserta un evento `Scanned`. Sirve para usuarios finales.

### list-bottles
**Endpoint:** `GET /functions/v1/list-bottles?lotId=...&limit=...`  
Filtros: `lotId`, `wineryAddress`, `currentOwnerAddress`. Retorna paginado con `latestEventType` y `latestEventTimestamp`.

## Custodial Wallet Function Details

### wallets-provision
`POST /functions/v1/wallets-provision` — requiere `Authorization: Bearer <access_token>`. Crea (o devuelve) un wallet custodial cifrando la secret con `ENCRYPTION_KEY`.

### wallets-default
`GET /functions/v1/wallets-default` — responde con metadata del wallet y crea uno “just in time” si no existe.

### wallets-sign-payment
`POST /functions/v1/wallets-sign-payment` — firma o envía pagos Stellar en nombre del usuario. Respeta `WALLET_SIGN_LIMIT_PER_MIN` y `WALLET_SIGN_LIMIT_PER_HOUR`, y registra auditoría en `wallet_activity_logs`.

## Network & Security

- `STELLAR_NETWORK` admite `PUBLIC`, `TESTNET`, `FUTURENET`. El helper `getStellarNetwork()` ajusta `HORIZON_URL` automáticamente.
- Mantén `ENCRYPTION_KEY` privado; sin él no podrás descifrar las custodial wallets.
- Si usas `PLATFORM_FUNDING_SECRET_KEY`, asegúrate de que la cuenta tenga XLM y habilita MFA en Supabase.

## Testing Snippets

```bash
# Mint bottle
curl -X POST https://<project>.supabase.co/functions/v1/mint-bottle \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "lotId":"MALBEC-2024-001","bottleNumber":1,"wineName":"Gran Reserva","vintage":2024 }'

# Public QR fetch
curl "https://<project>.supabase.co/functions/v1/get-bottle-traceability?qrCode=QR-MALBEC-2024-001-0001"
```

## Troubleshooting

1. **`ENCRYPTION_KEY` missing** → custodial functions fall back to 401/500. Configura el secret.
2. **Rate limit exceeded** → revisa `wallet_activity_logs` para ver quién saturó `wallets-sign-payment`.
3. **Traceability queries lentas** → agrega índices en `traceability_events (bottle_id, created_at)` y en `qr_code_mapping (qr_code)`.
4. **Soroban addresses vacías** → asegúrate de haber seteado `BOTTLE_FACTORY_ADDRESS`, etc., antes de publicar en mainnet.

## Flow Diagram (MVP)

```
1. mint-bottle
   ├─ Valida payload + genera bottle_id
   ├─ Guarda en DB y map QR
   └─ (Próx.) invoca BottleFactory

2. transfer-bottle
   ├─ Verifica owner
   ├─ Invoca Transfer contract
   └─ Registra evento Shipped

3. log-event
   └─ Guarda evento + sincroniza TraceabilityLog

4. get-bottle-traceability / list-bottles
   └─ Lee vista + dispara evento Scanned (si aplica)
```
