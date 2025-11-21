# 🍷 Winefy – Trazabilidad Verificable de Vinos en Blockchain

Winefy es una plataforma de trazabilidad blockchain para vinos premium que permite a bodegas, distribuidores e importadores registrar y verificar cada etapa del ciclo de vida de un lote de vino, desde la cosecha hasta el consumidor final, utilizando Wine Traceability Tokens (WTT) en Stellar.

---

## 1. Problem Statement

### What real-world problem are you solving?

La industria del vino enfrenta desafíos críticos de trazabilidad y autenticidad:

- **Falta de transparencia en la cadena de suministro**: Es difícil rastrear el origen real de un vino y verificar su autenticidad
- **Documentación fragmentada**: Los certificados y documentos están dispersos en diferentes sistemas, sin una fuente única de verdad
- **Riesgo de falsificación**: Los consumidores no pueden verificar fácilmente si un vino es auténtico
- **Trazabilidad limitada**: Bodegas, distribuidores e importadores no tienen una forma eficiente de registrar y compartir eventos de trazabilidad
- **Falta de inmutabilidad**: Los registros pueden ser alterados o perdidos, comprometiendo la confianza en el producto

### For whom is this a problem?

**Para bodegas:**
- Necesitan demostrar la autenticidad y calidad de sus productos
- Requieren una forma confiable de registrar eventos de producción (vinificación, barrica, embotellado)
- Buscan proteger su marca contra falsificaciones

**Para distribuidores e importadores:**
- Necesitan verificar la autenticidad de los lotes que reciben
- Requieren documentación completa y verificable para cumplir con regulaciones
- Buscan transparencia en la cadena de suministro

**Para consumidores:**
- Quieren verificar que el vino que compran es auténtico
- Desean conocer el origen y la historia completa del producto
- Buscan transparencia en lo que consumen

### Why is this problem urgent or important now?

- El mercado de vinos falsificados representa millones de dólares en pérdidas anuales
- Los consumidores demandan cada vez más transparencia sobre el origen de los productos
- Las regulaciones de trazabilidad se están volviendo más estrictas en muchos países
- La tecnología blockchain permite garantizar inmutabilidad y transparencia verificable
- La digitalización de la cadena de suministro es una tendencia creciente en la industria alimentaria

---

## 2. Target User and User Need

### Who is your primary user?

**Usuario primario: Bodegas**
- Bodegas de Argentina y Chile que producen vinos premium
- Necesitan certificar y rastrear sus lotes de producción
- Buscan proteger su marca y demostrar autenticidad

**Usuarios secundarios:**
- **Distribuidores e importadores**: Necesitan verificar lotes y registrar eventos de recepción/transporte
- **Retailers**: Requieren documentación verificable para sus clientes
- **Consumidores finales**: Quieren verificar autenticidad mediante QR codes

### What is their core need or pain point?

**Bodegas:**
- Necesitan registrar lotes de forma certificada e inmutable
- Requieren documentar cada etapa del proceso (cosecha, vinificación, barrica, embotellado)
- Buscan proteger su marca contra falsificaciones
- Necesitan compartir información verificable con la cadena de suministro

**Distribuidores/Importadores:**
- Necesitan verificar la autenticidad de los lotes recibidos
- Requieren registrar eventos de trazabilidad (recepción, almacenamiento, transporte)
- Buscan documentación completa y verificable

**Consumidores:**
- Quieren verificar que el vino es auténtico
- Desean conocer la historia completa del producto
- Necesitan acceso fácil mediante QR codes

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

Winefy es una plataforma de trazabilidad blockchain que permite a bodegas crear Wine Traceability Tokens (WTT) en Stellar para representar lotes de vino de forma inmutable y verificable. Cada lote puede tener eventos de trazabilidad registrados en blockchain (cosecha, vinificación, barrica, embotellado, transporte, etc.), y cada botella puede tener un QR único que permite a los consumidores verificar la autenticidad y ver la historia completa del producto.

**Core user journey:**

1. **Bodega**: Registra un lote de vino con información completa (cosecha, varietal, región, año, cantidad), sube documentación certificada, y se genera un WTT en Stellar representando ese lote
2. **Trazabilidad**: La bodega y otros actores (distribuidores, importadores) registran eventos en blockchain (vinificación, barrica, embotellado, recepción, transporte)
3. **Verificación**: Cada botella tiene un QR único que, al ser escaneado, muestra la trazabilidad completa verificable en blockchain
4. **Transparencia**: Cualquier persona puede auditar los eventos del lote en Stellar, garantizando transparencia verificable

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
- Bodegas registran información completa del lote: cosecha, varietal, región, año, cantidad
- Suben documentación certificada (certificados de origen, análisis, etc.)
- Se genera un Wine Traceability Token (WTT) en Stellar representando ese lote
- El lote queda registrado de forma inmutable en blockchain

**How we will know if it's working:**
- Una bodega puede completar el formulario de registro de lote
- El WTT se crea exitosamente en Stellar para un lote
- El lote aparece en el dashboard con su token verificado
- Los documentos quedan asociados al lote

### Feature 2: Registro de Eventos de Trazabilidad
**What the user can do:**
- La bodega registra pasos del proceso: vinificación, barrica, embotellado, etc.
- Importadores y distribuidores pueden agregar eventos al recibir el lote (recepción, almacenamiento, transporte)
- Cada evento queda registrado en blockchain de forma inmutable
- Los eventos aparecen en un timeline verificable

**How we will know if it's working:**
- Los eventos se registran exitosamente en Stellar
- Los eventos aparecen en un timeline cronológico
- Cada evento es verificable en la blockchain pública
- Los roles son validados antes de permitir registro de eventos

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

### Feature 4: QR para Autenticidad (para Consumidores)
**What the user can do:**
- Cada lote/botella genera un QR único
- Al escanear el QR, el usuario ve la trazabilidad completa del lote
- Verificación de autenticidad en tiempo real
- Acceso a documentación certificada

**How we will know if it's working:**
- Se genera un QR único para cada lote/botella
- Al escanear el QR, se muestra la información de trazabilidad
- La información es verificable contra la blockchain
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
- `/` - Homepage con información sobre trazabilidad
- `/dashboard` - Dashboard de trazabilidad con todos los lotes
- `/lotes/nuevo` - Formulario para registrar nuevo lote
- `/lotes/[id]` - Detalle de lote con timeline de eventos
- `/qr/[code]` - Vista pública para escanear QR (sin login requerido)
- `/eventos/registrar` - Formulario para registrar eventos de trazabilidad

### Backend / Services
- **Runtime**: Node.js
- **Framework**: Next.js API Routes o Express.js
- **Stellar Integration**: 
  - Servicio para crear y gestionar WTT en Stellar
  - Servicio para registrar eventos de trazabilidad
  - Integración con Soroban para smart contracts

**API Endpoints (planned):**
- `POST /api/lotes` - Crear nuevo lote y generar WTT
- `GET /api/lotes` - Listar todos los lotes
- `GET /api/lotes/[id]` - Obtener detalles de un lote
- `POST /api/eventos` - Registrar evento de trazabilidad
- `GET /api/eventos/[loteId]` - Obtener eventos de un lote
- `GET /api/qr/[code]` - Verificar QR y obtener información del lote
- `POST /api/transferencias` - Transferir ownership de un lote

### Smart Contracts (Soroban)
- **Traceability Contract**: 
  - Crear lote (WTT)
  - Registrar eventos de trazabilidad
  - Transferencias verificadas entre actores
  - Validación de roles (bodega, distribuidor, importador)
  - Garantía de inmutabilidad de datos

**Lenguaje**: Rust (Soroban)

### Data / Storage
- **Database**: PostgreSQL o Supabase
  - Información de lotes (metadatos)
  - Documentos de certificación
  - Usuarios y roles
  - Eventos de trazabilidad (cache local, fuente de verdad en Stellar)

- **Blockchain**: Stellar Network
  - Wine Traceability Tokens (WTT) representando lotes
  - Eventos de trazabilidad registrados en cadena
  - Transferencias de ownership
  - Validación de roles

- **File Storage**: 
  - Documentos de certificación (Supabase Storage, AWS S3, o IPFS)
  - Imágenes de lotes y botellas

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
│  - Stellar SDK Integration          │
│  - QR Code Generation               │
│  - Dashboard & Forms                │
└──────┬──────────────────┬───────────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│   Backend    │   │   Stellar    │
│  (API Routes)│   │   Network    │
│              │   │              │
│  - Business  │   │  - WTT       │
│    Logic     │◄──┤  - Events    │
│  - Auth      │   │  - Soroban   │
│  - File      │   │    Contracts │
│    Upload    │   │              │
└──────┬───────┘   └──────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  / Supabase  │
│              │
│  - Lotes     │
│  - Eventos   │
│  - Users     │
│  - Docs      │
└──────────────┘
```

---

## 6. Success Criteria for the Hackathon

By the end of Stellar Hack+, we will consider our MVP successful if:

- [ ] **Una bodega puede digitalizar un lote**: Complete el formulario de registro, suba documentación, y se genere exitosamente un WTT en Stellar representando el lote
- [ ] **Se pueden registrar eventos de trazabilidad**: Los eventos (vinificación, barrica, embotellado, etc.) se registran en blockchain y aparecen en un timeline verificable
- [ ] **Un QR permite ver información real del lote**: Se genera un QR único para un lote, y al escanearlo se muestra la trazabilidad completa verificable
- [ ] **El dashboard muestra trazabilidad completa**: El dashboard muestra todos los lotes con su estado actual, eventos completados, y documentos, con datos verificables desde Stellar
- [ ] **Se demuestra un flujo completo**: Crear lote → registrar eventos → visualizar trazabilidad → escanear QR, todo funcionando end-to-end
- [ ] **Transparencia verificable**: Cualquier persona puede verificar los eventos del lote en la blockchain pública de Stellar

**Stretch Goals:**
- [ ] Transferencias de ownership entre actores (bodega → distribuidor → retailer)
- [ ] App móvil liviana para escanear QR codes
- [ ] Notificaciones en tiempo real cuando se registran eventos
- [ ] Integración con sistemas existentes de bodegas

---

## 7. Team

- **Team name**: Winefy

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

Create a `.env.local` file:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
DATABASE_URL=your_database_url
```

### Stellar Setup

1. Create a Stellar testnet account
2. Fund it with testnet lumens
3. Configure your environment variables
4. Deploy Soroban contracts (when ready)

---

## License

MIT
