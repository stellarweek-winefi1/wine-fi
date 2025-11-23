# 🍷 Vinifica – Plataforma de Digitalización y Trazabilidad de Vinos

Vinifica es una plataforma para digitalizar los vinos que permite a los dueños de bodegas rastrear sus lotes en tiempo real para detectar cuándo se daña un vino y saber exactamente en qué parte del proceso ocurre. Los clientes pueden ver esta trazabilidad completa y, si lo desean, pueden comprar vinos directamente en USDC.

---

## 1. Problem Statement

### What real-world problem are you solving?

La industria del vino enfrenta desafíos críticos de digitalización y trazabilidad:

- **Falta de digitalización**: Los lotes de vino no están digitalizados, dificultando el seguimiento en tiempo real
- **Detección tardía de daños**: Los dueños no pueden detectar rápidamente cuándo y dónde se daña un vino en el proceso
- **Trazabilidad fragmentada**: No existe una forma eficiente de rastrear exactamente en qué parte del proceso ocurre un problema
- **Transparencia limitada para clientes**: Los clientes no pueden verificar la trazabilidad completa de los vinos que compran
- **Falta de opciones de compra directa**: No existe una plataforma simple para que los clientes compren vinos certificados en USDC

### For whom is this a problem?

**Para dueños de bodegas:**
- Necesitan digitalizar sus lotes de vino para tener visibilidad completa
- Requieren detectar rápidamente cuándo se daña un vino durante el proceso
- Buscan saber exactamente en qué parte del proceso (viñedo, producción, bodega, transporte, almacenamiento) ocurre el daño
- Necesitan proteger sus inversiones identificando problemas tempranamente

**Para clientes y compradores:**
- Quieren ver la trazabilidad completa de los vinos antes de comprar
- Desean verificar la autenticidad y el origen del producto
- Buscan una forma sencilla de comprar vinos certificados en USDC
- Necesitan transparencia sobre cada etapa del proceso

### Why is this problem urgent or important now?

- Las pérdidas por vinos dañados durante el proceso representan millones de dólares anuales
- La detección tardía de daños genera pérdidas significativas para los dueños de bodegas
- Los clientes demandan cada vez más transparencia sobre el origen y trazabilidad de los vinos
- La digitalización de productos premium es una tendencia creciente en la industria
- Los pagos en criptomonedas (USDC) se están volviendo más aceptados para transacciones de alto valor
- La tecnología permite rastrear exactamente dónde y cuándo ocurre un problema en el proceso

---

## 2. Target User and User Need

### Who is your primary user?

**Usuario primario: Dueños de Bodegas**
- Dueños de bodegas que producen vinos premium
- Necesitan digitalizar sus lotes para tener control total
- Buscan detectar problemas y daños en tiempo real durante el proceso
- Requieren identificar exactamente dónde ocurre un daño (viñedo, producción, bodega, transporte, etc.)

**Usuarios secundarios:**
- **Clientes y compradores**: Quieren ver la trazabilidad completa y comprar vinos en USDC
- **Distribuidores**: Necesitan verificar lotes y registrar eventos de recepción/transporte
- **Consumidores finales**: Desean verificar autenticidad mediante QR codes

### What is their core need or pain point?

**Dueños de Bodegas:**
- Necesitan digitalizar sus lotes para tener visibilidad completa en tiempo real
- Requieren detectar rápidamente cuándo se daña un vino durante el proceso
- Buscan saber exactamente en qué parte del proceso ocurre el daño
- Necesitan proteger sus inversiones identificando problemas tempranamente
- Desean registrar cada etapa del proceso (viñedo, producción, bodega, almacenamiento, transporte, exportación)

**Clientes y Compradores:**
- Quieren ver la trazabilidad completa de los vinos antes de comprar
- Desean verificar la autenticidad y el origen del producto
- Buscan una forma sencilla de comprar vinos certificados en USDC
- Necesitan transparencia sobre cada etapa del proceso

**Consumidores:**
- Quieren verificar que el vino es auténtico mediante QR codes
- Desean conocer la historia completa del producto desde el viñedo hasta el embotellado

### How do they currently solve this?

**Bodegas:**
- Usan sistemas de gestión internos no conectados
- Emiten certificados en papel que pueden perderse o falsificarse
- Dependen de sistemas centralizados vulnerables
- **Workaround actual**: Documentación física, sistemas aislados, sin verificación pública

**Distribuidores/Importadores:**
- Confían en documentación en papel
- No tienen forma de verificar la autenticidad de los lotes
- **Workaround actual**: Confianza en la cadena de suministro, sin verificación independiente

**Consumidores:**
- Confían en el retailer o la marca
- No tienen forma de verificar autenticidad
- **Workaround actual**: No hay forma real de verificar, solo confianza

---

## 3. Solution Overview

### 3.1 Main Idea

Vinifica es una plataforma para digitalizar los vinos que permite a los dueños de bodegas rastrear sus lotes en tiempo real para detectar cuándo se daña un vino y saber exactamente en qué parte del proceso ocurre. Los clientes pueden ver esta trazabilidad completa y, si lo desean, pueden comprar vinos directamente en USDC.

**Core user journey:**

1. **Digitalización**: El dueño de la bodega registra un lote de vino con información completa (varietal, región, año, cantidad, precio en USDC), sube documentación certificada, y se genera un Certificado de Autenticidad único
2. **Trazabilidad en Tiempo Real**: El dueño y su equipo registran eventos en cada etapa del proceso (viñedo, producción, bodega, almacenamiento, transporte, exportación). Si ocurre un daño, se registra inmediatamente con ubicación exacta
3. **Detección de Daños**: El sistema permite detectar rápidamente cuándo se daña un vino y en qué parte exacta del proceso, permitiendo acciones correctivas inmediatas
4. **Visualización para Clientes**: Los clientes pueden ver la trazabilidad completa de cualquier lote, verificando cada etapa del proceso
5. **Compra en USDC**: Los clientes pueden comprar lotes certificados directamente en USDC desde la plataforma
6. **Verificación por QR**: Cada botella tiene un QR único que, al ser escaneado, muestra la trazabilidad completa verificable

### 3.2 Why Stellar?

**Stellar Network es ideal para Winefy porque:**

- **Inmutabilidad garantizada**: Una vez registrados, los eventos no pueden ser alterados, garantizando la integridad de los datos
- **Transparencia verificable**: Cualquiera puede auditar los eventos del lote en la blockchain pública
- **Bajo costo**: Comisiones mínimas ($0.00001) permiten registrar muchos eventos sin costo prohibitivo
- **Rapidez**: Transacciones confirmadas en 3-5 segundos
- **Soroban Smart Contracts**: Para lógica compleja como:
  - Validación de roles (bodega, distribuidor, importador)
  - Registro de eventos de trazabilidad
  - Transferencias verificadas entre actores
  - Garantía de inmutabilidad de datos
- **Asset Issuance**: Creación de Wine Traceability Tokens (WTT) representando lotes
- **Transparencia verificable**: Cualquiera puede auditar los eventos del lote

**Elementos de Stellar que usaremos:**

- ✅ **Stellar Network**: Para transacciones y registro de eventos
- ✅ **Soroban Smart Contracts**: Para lógica de trazabilidad (Traceability Contract)
  - Crear lote (WTT)
  - Registrar eventos
  - Transferencias verificadas
  - Validación de roles
- ✅ **Asset Issuance**: Creación de Wine Traceability Tokens (WTT)
- ✅ **Stellar SDK**: Integración frontend/backend con la red
- ✅ **Blockchain pública**: Para transparencia verificable

**Características clave:**
- **Certificación de lotes**: Cada lote se certifica con un WTT en Stellar
- **Registro de eventos de trazabilidad**: Cada evento queda registrado en blockchain
- **Validación de roles**: Verificación de permisos (bodega, distribuidor, importador)
- **Garantía de inmutabilidad**: Los datos no pueden ser alterados una vez registrados
- **Transparencia verificable**: Cualquiera puede auditar los eventos del lote

---

## 4. Core Features (Planned for the Hackathon)

### Feature 1: Digitalización del Lote
**What the user can do:**
- Los dueños de bodegas registran información completa del lote: varietal, región, año, cantidad, precio en USDC
- Suben documentación certificada (certificados de origen, análisis, etc.)
- Se genera un Certificado de Autenticidad único para ese lote
- El lote queda digitalizado y listo para rastreo en tiempo real

**How we will know if it's working:**
- Un dueño puede completar el formulario de registro de lote con precio en USDC
- El Certificado de Autenticidad se genera exitosamente
- El lote aparece en el dashboard con su certificado verificado
- Los documentos quedan asociados al lote

### Feature 2: Registro de Eventos de Trazabilidad y Detección de Daños
**What the user can do:**
- El dueño y su equipo registran eventos en cada etapa del proceso: viñedo, producción, bodega, almacenamiento, transporte, exportación
- Si ocurre un daño, se registra inmediatamente con ubicación exacta y descripción del problema
- El sistema permite detectar rápidamente cuándo se daña un vino y en qué parte exacta del proceso
- Cada evento queda registrado con timestamp y ubicación precisa
- Los eventos aparecen en un timeline verificable con alertas para daños

**How we will know if it's working:**
- Los eventos se registran exitosamente en cada etapa del proceso
- Los eventos aparecen en un timeline cronológico con ubicación exacta
- Si se registra un daño, se muestra una alerta inmediata
- El dueño puede ver exactamente en qué parte del proceso ocurrió el daño
- Los eventos son verificables y transparentes

### Feature 3: Dashboard de Trazabilidad
**What the user can do:**
- Ver todos los lotes digitalizados
- Ver estado actual, etapas completadas y documentos asociados
- Consultar información desde cualquier dispositivo
- Ver timeline completo de eventos para cada lote

**How we will know if it's working:**
- El dashboard muestra todos los lotes registrados
- Cada lote muestra su estado actual y eventos completados
- La información se carga desde Stellar y la base de datos
- El dashboard es responsive y funciona en móviles

### Feature 4: Visualización de Trazabilidad para Clientes
**What the user can do:**
- Los clientes pueden ver la trazabilidad completa de cualquier lote disponible
- Visualizan cada etapa del proceso (viñedo, producción, bodega, transporte, etc.)
- Pueden verificar la autenticidad y el origen del producto
- Acceso a documentación certificada del lote

**How we will know if it's working:**
- Los clientes pueden acceder a la página de lotes y ver la trazabilidad completa
- Se muestra un timeline con todas las etapas del proceso
- La información es transparente y verificable
- Los clientes pueden verificar autenticidad antes de comprar

### Feature 5: Compra de Vinos en USDC
**What the user can do:**
- Los clientes pueden ver todos los lotes disponibles con sus precios en USDC
- Pueden comprar lotes certificados directamente desde la plataforma
- Compra rápida con un clic o compra con confirmación de detalles
- Una vez comprado, el lote se marca como vendido

**How we will know if it's working:**
- Los clientes pueden ver los precios en USDC en cada lote
- Pueden hacer clic en "Comprar Ahora" para compra directa
- Pueden ver detalles antes de confirmar la compra
- Después de la compra, el lote desaparece de la lista de disponibles
- Se muestra una confirmación de compra exitosa

### Feature 6: QR para Autenticidad (para Consumidores)
**What the user can do:**
- Cada lote/botella genera un QR único
- Al escanear el QR, el usuario ve la trazabilidad completa del lote
- Verificación de autenticidad en tiempo real
- Acceso a documentación certificada

**How we will know if it's working:**
- Se genera un QR único para cada lote/botella
- Al escanear el QR, se muestra la información de trazabilidad
- La información es verificable
- Los consumidores pueden verificar autenticidad

### Feature 5: (Stretch Goal) Transferencia de Lotes entre Actores
**What the user can do:**
- Se puede transferir ownership del lote del productor → distribuidor → retailer
- Cada transferencia queda registrada en Stellar
- Validación de roles antes de permitir transferencias
- Historial completo de ownership

**How we will know if it's working:**
- Un lote puede ser transferido entre actores autorizados
- La transferencia se registra en Stellar
- El historial de ownership es visible y verificable
- Los roles son validados correctamente

---

## 5. MVP Architecture (Initial Idea)

### Frontend
- **Framework**: Next.js 15 (React 19, TypeScript)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Stellar Integration**: 
  - `@stellar/stellar-sdk` para interacción con Stellar
  - `@stellar/freighter-api` para integración con Freighter wallet
  - WalletConnect para soporte de múltiples wallets
- **QR Generation**: Librería para generar QR codes únicos

**Pages:**
- `/` - Homepage con información sobre digitalización y trazabilidad
- `/lotes` - Lista de todos los lotes certificados con precios en USDC
- `/lotes/nuevo` - Formulario para registrar nuevo lote (con precio en USDC)
- `/lotes/[id]` - Detalle de lote con timeline de eventos y detección de daños
- `/buy` - Página para comprar lotes disponibles en USDC
- `/qr/[code]` - Vista pública para escanear QR (sin login requerido)
- `/eventos/registrar` - Formulario para registrar eventos de trazabilidad y daños

### Backend / Services
- **Platform**: Supabase (PostgreSQL + Edge Functions)
- **Runtime**: Deno (Edge Functions)
- **Stellar Integration**: 
  - Edge Functions para crear y gestionar tokens de vino en Stellar
  - Edge Functions para registrar eventos de trazabilidad
  - Integración con Soroban para smart contracts
  - Gestión de wallets custodiales para usuarios

**Supabase Edge Functions:**
- `wine-tokens-create` - Crear nuevo token de lote de vino (WTT) en blockchain
- `wine-tokens-mint` - Acuñar tokens de vino a direcciones
- `wine-tokens-transfer` - Transferir tokens entre wallets
- `wine-lots-get-history` - Obtener historial de eventos de un lote
- `wine-lots-update-status` - Actualizar estado de un lote
- `wine-bottles-mint` - Crear registros de botellas individuales
- `wine-bottles-get-traceability` - Obtener trazabilidad completa de una botella (público)
- `wine-bottles-update-status` - Actualizar estado de una botella
- `wallets-provision` - Crear o obtener wallet custodial
- `wallets-default` - Obtener wallet por defecto del usuario
- `wallets-sign-payment` - Firmar y enviar pagos Stellar
- `wallets-auto-create` - Crear wallet automáticamente (trigger)

Ver documentación completa en `supabase/functions/README.md`

### Smart Contracts (Soroban)
- **Traceability Contract**: 
  - Crear lote (WTT)
  - Registrar eventos de trazabilidad
  - Transferencias verificadas entre actores
  - Validación de roles (bodega, distribuidor, importador)
  - Garantía de inmutabilidad de datos

**Lenguaje**: Rust (Soroban)

### Data / Storage
- **Database**: Supabase (PostgreSQL)
  - `wine_tokens` - Tokens de lotes de vino desplegados en blockchain
  - `wine_token_holdings` - Balances de tokens de usuarios (caché)
  - `wine_token_transactions` - Historial de transacciones
  - `wine_lot_status_events` - Eventos de estado a nivel de lote
  - `wine_bottles` - Registros de botellas individuales con NFTs
  - `bottle_status_events` - Eventos de estado a nivel de botella
  - `bottle_qr_codes` - Mapeo de códigos QR
  - `user_wallets` - Wallets custodiales de usuarios
  - `wallet_activity_logs` - Registro de actividad de wallets
  - Usuarios y autenticación (Supabase Auth)

- **Blockchain**: Stellar Network (Soroban)
  - Wine Tokens (contratos Soroban) representando lotes
  - Factory Contract para crear tokens
  - Eventos de trazabilidad registrados en cadena
  - Transferencias verificadas
  - NFTs para botellas individuales

- **File Storage**: Supabase Storage
  - Bucket `wine-lots` - Documentos de certificación
  - Imágenes de lotes y botellas
  - Archivos de documentación

### Architecture Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
│  - React Components                 │
│  - Supabase Client                  │
│  - QR Code Generation               │
│  - Dashboard & Forms                │
└──────┬──────────────────┬───────────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────────┐   ┌──────────────┐
│   Supabase       │   │   Stellar    │
│   Edge Functions │   │   Network    │
│                  │   │              │
│  - wine-tokens-  │   │  - Wine      │
│    create        │◄──┤    Tokens    │
│  - wine-lots-    │   │  - Factory   │
│    update-status │   │    Contract  │
│  - wallets-*     │   │  - Soroban   │
│  - File Upload   │   │    Contracts │
└──────┬───────────┘   └──────────────┘
       │
       ▼
┌──────────────────────────┐
│   Supabase (PostgreSQL)   │
│                           │
│  - wine_tokens           │
│  - wine_lot_status_events│
│  - wine_bottles          │
│  - bottle_status_events  │
│  - user_wallets          │
│  - Auth (users)          │
└──────────────────────────┘
       │
       ▼
┌──────────────────────────┐
│   Supabase Storage       │
│                           │
│  - wine-lots bucket      │
│  - Documentos            │
│  - Imágenes              │
└──────────────────────────┘
```

---

## 6. Success Criteria for the Hackathon

By the end of Stellar Hack+, we will consider our MVP successful if:

- [ ] **Un dueño puede digitalizar un lote**: Complete el formulario de registro con precio en USDC, suba documentación, y se genere exitosamente un Certificado de Autenticidad
- [ ] **Se pueden registrar eventos de trazabilidad y detectar daños**: Los eventos se registran en cada etapa del proceso (viñedo, producción, bodega, transporte, etc.) y si hay un daño, se detecta inmediatamente con ubicación exacta
- [ ] **El dueño puede ver exactamente dónde ocurre un daño**: Si un vino se daña, el sistema muestra en qué parte exacta del proceso ocurrió el problema
- [ ] **Los clientes pueden ver la trazabilidad completa**: Los clientes pueden acceder a la información de trazabilidad de cualquier lote disponible
- [ ] **Los clientes pueden comprar lotes en USDC**: Los clientes pueden ver precios en USDC y comprar lotes certificados directamente desde la plataforma
- [ ] **Un QR permite ver información real del lote**: Se genera un QR único para un lote, y al escanearlo se muestra la trazabilidad completa verificable
- [ ] **Se demuestra un flujo completo**: Crear lote → registrar eventos → detectar daño → visualizar trazabilidad → comprar en USDC → escanear QR, todo funcionando end-to-end

**Stretch Goals:**
- [ ] Notificaciones en tiempo real cuando se detecta un daño
- [ ] App móvil liviana para registrar eventos y escanear QR codes
- [ ] Integración con sistemas existentes de bodegas
- [ ] Análisis predictivo para prevenir daños

---

## 7. Team

- **Team name**: Vinifica

- **Members and roles**:
  - **Mateo Quintana** – Product and Marketing
  - **Anwar Sánchez** – Frontend & Blockchain
  - **Manuel Paredes** – Backend & Blockchain

- **Links**:
  - GitHub: (Add your repo link)
  - Demo: (Add demo link when available)
  - Stellar Account: (Add Stellar account if public)

---

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Stellar Testnet account (for development)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Stellar Network Configuration (Optional, defaults shown)
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

### Supabase Setup

1. **Create Supabase Project**
   - Go to https://app.supabase.com
   - Create a new project
   - Copy your project URL and anon key

2. **Run Database Migrations**
   ```bash
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Apply migrations
   supabase db push
   ```

3. **Deploy Edge Functions**
   ```bash
   # Deploy all functions
   supabase functions deploy wine-tokens-create
   supabase functions deploy wine-tokens-mint
   supabase functions deploy wine-tokens-transfer
   supabase functions deploy wine-lots-get-history
   supabase functions deploy wine-lots-update-status
   supabase functions deploy wine-bottles-mint
   supabase functions deploy wine-bottles-get-traceability
   supabase functions deploy wine-bottles-update-status
   supabase functions deploy wallets-provision
   supabase functions deploy wallets-default
   supabase functions deploy wallets-sign-payment
   supabase functions deploy wallets-auto-create
   ```

4. **Configure Edge Function Secrets**
   - Go to Supabase Dashboard → Settings → Edge Functions → Secrets
   - Set required secrets:
     ```bash
     ENCRYPTION_KEY=<generate with: openssl rand -base64 32>
     STELLAR_NETWORK=TESTNET
     STELLAR_RPC_URL=https://soroban-testnet.stellar.org
     STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
     WINE_FACTORY_ID=<your-factory-contract-address>
     TOKEN_WASM_HASH=<your-token-wasm-hash>
     ```

5. **Create Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Create bucket named `wine-lots`
   - Set it to public or configure RLS policies

### Stellar Setup

1. **Deploy Smart Contracts**
   ```bash
   cd contracts
   ./deploy_wine_token.sh testnet your-account
   source .deployed_wine_token_testnet.env
   ```

2. **Update Edge Function Secrets**
   - Set `WINE_FACTORY_ID` and `TOKEN_WASM_HASH` from deployment

3. **Fund Test Accounts**
   - Use Stellar Friendbot for testnet: https://laboratory.stellar.org/#account-creator?network=testnet

Ver documentación completa:
- Edge Functions: `supabase/functions/README.md`
- Smart Contracts: `contracts/README.md`

---

## License

MIT
