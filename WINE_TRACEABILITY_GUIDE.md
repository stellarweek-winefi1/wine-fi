# Wine Traceability System - Complete Guide

## Overview

This document describes the complete on-chain wine traceability system implemented for the Wine-Fi platform. The system provides two-level tracking:

1. **Lot-Level**: Track entire wine lots through production lifecycle
2. **Bottle-Level**: Track individual bottles as NFTs with QR codes

## Architecture

### Hybrid Approach

The system uses a **hybrid database + blockchain** architecture:

- **Database (PostgreSQL)**: Fast queries, rich search capabilities, real-time subscriptions
- **Blockchain (Stellar)**: Immutable proof, decentralized verification, public transparency

This approach combines the best of both worlds: speed and usability from the database, with trust and immutability from the blockchain.

## Database Schema

### Lot-Level Tables

#### `wine_lot_status_events`
Tracks production lifecycle for entire wine lots:

- `token_id`: Reference to parent wine token
- `status`: Current status (harvested, fermented, aged, bottled, shipped, available, sold_out, recalled)
- `previous_status`: Previous status for audit trail
- `transaction_hash`: Blockchain transaction for verification
- `location`: Physical location
- `location_coordinates`: GPS coordinates
- `handler_name`: Person/entity responsible
- `notes`: Additional context
- `event_timestamp`: When the event occurred

**Production Lifecycle Statuses:**
```
HARVESTED → FERMENTED → AGED → BOTTLED → SHIPPED → AVAILABLE
```

### Bottle-Level Tables

#### `wine_bottles`
Individual bottle records with NFT addresses:

- `token_id`: Parent wine lot token
- `bottle_number`: Sequential number (1 to bottle_count)
- `nft_address`: On-chain NFT contract address
- `qr_code_hash`: Unique QR code identifier
- `current_status`: Latest status
- `current_location`: Current physical location
- `current_owner_wallet`: Current owner

**Bottle Statuses:**
```
bottled → in_warehouse → shipped → in_transit → delivered → scanned → consumed
```

#### `bottle_status_events`
Status change history for individual bottles:

- `bottle_id`: Reference to bottle
- `status`: New status
- `scan_type`: Type of scan (warehouse_in, warehouse_out, shipping, delivery, retail_scan, consumer_scan, verification)
- `location`: Where the event occurred
- `handler_name`: Who performed the action
- `transaction_hash`: Blockchain proof

#### `bottle_qr_codes`
QR code mapping and scan tracking:

- `bottle_id`: Reference to bottle
- `qr_code`: Actual QR code data
- `qr_code_hash`: Hashed identifier
- `is_active`: Whether code is valid
- `scan_count`: Number of times scanned
- `last_scanned_at`: Last scan timestamp

### Views

#### `wine_lot_current_status`
Quick view of current lot status with latest event.

#### `bottle_traceability`
Complete bottle journey including:
- Bottle information
- All bottle status events
- Parent lot status history
- Wine metadata

## Edge Functions (API)

### Lot-Level Functions

#### `wine-lots-update-status`
Update wine lot status with blockchain proof.

**POST** `/functions/v1/wine-lots-update-status`

```typescript
{
  "token_id": "uuid",
  "status": "harvested" | "fermented" | "aged" | "bottled" | "shipped" | "available",
  "location": "string (optional)",
  "location_coordinates": { "latitude": number, "longitude": number } // optional
  "handler_name": "string (optional)",
  "notes": "string (optional)",
  "metadata": {} // optional
}
```

**Authorization**: Requires token admin

**Response**:
```typescript
{
  "success": true,
  "event": LotStatusEvent,
  "message": "Status updated successfully"
}
```

#### `wine-lots-get-history`
Get complete status history for a wine lot.

**GET** `/functions/v1/wine-lots-get-history?token_id={id}&include_metadata=true`

**Public access** (no authentication required)

**Response**:
```typescript
{
  "token": {
    "id": "uuid",
    "name": "string",
    "symbol": "string",
    "address": "string",
    "wine_metadata": WineLotMetadata // if include_metadata=true
  },
  "current_status": {
    "status": "string",
    "location": "string",
    "handler_name": "string",
    "event_timestamp": "ISO 8601",
    "transaction_hash": "string"
  },
  "history": LotStatusEvent[],
  "history_count": number
}
```

### Bottle-Level Functions

#### `wine-bottles-mint`
Mint individual bottle NFTs for a wine lot.

**POST** `/functions/v1/wine-bottles-mint`

```typescript
{
  "token_id": "uuid",
  "bottle_count": number, // optional, uses token's bottle_count if not specified
  "start_number": number, // optional, default: 1
  "generate_qr_codes": boolean // optional, default: true
}
```

**Authorization**: Requires token admin

**Response**:
```typescript
{
  "success": true,
  "message": "Successfully minted N bottles",
  "bottles_created": number,
  "qr_codes_generated": number
}
```

#### `wine-bottles-update-status`
Update individual bottle status.

**POST** `/functions/v1/wine-bottles-update-status`

```typescript
{
  "bottle_id": "uuid",
  "status": "bottled" | "in_warehouse" | "shipped" | "in_transit" | "delivered" | "scanned" | "consumed",
  "location": "string (optional)",
  "location_coordinates": { "latitude": number, "longitude": number }, // optional
  "handler_name": "string (optional)",
  "scan_type": "warehouse_in" | "warehouse_out" | "shipping" | "delivery" | "retail_scan" | "consumer_scan" | "verification", // optional
  "notes": "string (optional)",
  "metadata": {} // optional
}
```

**Authorization**: Requires token admin OR consumer scan type

**Response**:
```typescript
{
  "success": true,
  "event": BottleStatusEvent,
  "message": "Bottle status updated successfully"
}
```

#### `wine-bottles-get-traceability`
Get complete bottle traceability (public endpoint for QR scanning).

**GET** `/functions/v1/wine-bottles-get-traceability?qr_code={code}`

**Public access** (no authentication required)

**Response**:
```typescript
{
  "bottle": {
    "id": "uuid",
    "number": number,
    "qr_code_hash": "string",
    "current_status": "string",
    "current_location": "string",
    "nft_address": "string"
  },
  "wine": {
    "id": "uuid",
    "name": "string",
    "symbol": "string",
    "metadata": WineLotMetadata
  },
  "qr_code": {
    "code": "string",
    "scan_count": number,
    "last_scanned_at": "ISO 8601"
  },
  "bottle_history": BottleStatusEvent[],
  "lot_history": LotStatusEvent[],
  "authenticity": {
    "verified": boolean,
    "blockchain_proof": boolean,
    "total_events": number
  }
}
```

## Frontend SDK

### Lot Status Functions

```typescript
import {
  updateLotStatus,
  getLotStatusHistory,
  getCurrentLotStatus,
  subscribeToLotStatusChanges,
} from '@/lib/wine-tokens';

// Update lot status
const result = await updateLotStatus(tokenId, 'bottled', {
  location: 'Bodega Principal',
  notes: 'Embotellado completado'
});

// Get status history
const history = await getLotStatusHistory(tokenId, true); // include metadata

// Get current status
const currentStatus = await getCurrentLotStatus(tokenId);

// Subscribe to real-time updates
const subscription = subscribeToLotStatusChanges(tokenId, (payload) => {
  console.log('New status event:', payload);
});
```

### Bottle Functions

```typescript
import {
  mintBottles,
  updateBottleStatus,
  getBottlesByToken,
  getBottleTraceability,
  getBottleTraceabilityByQR,
  subscribeToBottleStatusChanges,
} from '@/lib/wine-tokens';

// Mint bottles for a lot
const result = await mintBottles(tokenId, 1000, {
  generate_qr_codes: true
});

// Update bottle status
const result = await updateBottleStatus(bottleId, 'shipped', {
  location: 'Centro de Distribución',
  scan_type: 'shipping'
});

// Get all bottles for a lot
const bottles = await getBottlesByToken(tokenId);

// Get bottle traceability by QR code (public)
const traceability = await getBottleTraceabilityByQR('WINE-ADDR-123');

// Subscribe to bottle status changes
const subscription = subscribeToBottleStatusChanges(bottleId, (payload) => {
  console.log('Bottle status changed:', payload);
});
```

## User Interface

### Pages Updated

#### `/app/scan/page.tsx`
QR code scanner that:
- Scans bottle QR codes
- Fetches traceability data
- Displays bottle and lot information
- Shows authenticity verification
- Links to detailed bottle and lot pages

#### `/app/trazabilidad/[id]/page.tsx`
Lot traceability page that:
- Displays lot information
- Shows production lifecycle timeline
- Displays all status events
- Shows blockchain verification badges
- Includes QR code generation section

## Smart Contract Integration

### Status Event Functions (Soroban)

```typescript
// Emit lot status event (blockchain proof)
export async function emitLotStatusEvent(
  tokenAddress: string,
  adminSecret: string,
  status: string,
  location?: string,
  metadata?: Record<string, any>
): Promise<{ hash: string }>;

// Bottle NFT functions
export async function createBottleNFT(...): Promise<{ hash: string; nftAddress: string }>;
export async function updateBottleNFTStatus(...): Promise<{ hash: string }>;
export async function getBottleNFTInfo(...): Promise<BottleInfo>;
```

**Note**: The blockchain integration functions are placeholders. To fully implement:

1. Add `emit_event` method to wine token contract
2. Deploy bottle NFT contract with status tracking
3. Implement status update methods in contracts

## Usage Flow

### Creating a Wine Lot with Traceability

1. **Create Wine Token** (via `wine-tokens-create`)
2. **Update Status to "harvested"**
   ```typescript
   await updateLotStatus(tokenId, 'harvested', {
     location: 'Viñedo Principal',
     notes: 'Cosecha 2024 completada'
   });
   ```

3. **Progress through production**
   ```typescript
   await updateLotStatus(tokenId, 'fermented');
   await updateLotStatus(tokenId, 'aged');
   await updateLotStatus(tokenId, 'bottled');
   ```

4. **Mint Individual Bottles**
   ```typescript
   await mintBottles(tokenId); // Uses bottle_count from metadata
   ```

5. **Track Bottles through Supply Chain**
   ```typescript
   await updateBottleStatus(bottleId, 'shipped', {
     scan_type: 'shipping'
   });
   ```

6. **Consumer Verification**
   - Customer scans QR code
   - System displays full traceability
   - Authenticity verified via blockchain

## Security & Permissions

### Row Level Security (RLS)

- **Lot Status Events**: Anyone can view (transparency), only admin can create
- **Bottles**: Anyone can view (authenticity verification), only admin can create
- **Bottle Status Events**: Anyone can view, admin or consumers can create scans
- **QR Codes**: Only active codes are publicly visible

### Authorization

- **Admin Actions**: Creating bottles, updating lot status
- **Consumer Actions**: Scanning QR codes, viewing traceability
- **Public Actions**: Reading lot and bottle history

## Database Migration

Apply the traceability migration:

```bash
cd /home/linuxito11/wine-fi
supabase db push
```

This creates:
- 4 new tables
- 2 views
- Indexes for performance
- RLS policies
- Triggers for auto-updates

## Environment Variables

No new environment variables required. Uses existing:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WINE_FACTORY_ID`

## Next Steps

### Future Enhancements

1. **Blockchain Integration**
   - Update wine token contract with status event methods
   - Deploy bottle NFT contract
   - Implement full on-chain verification

2. **Advanced Features**
   - Temperature tracking during storage/shipping
   - Photo uploads at each status change
   - Digital signatures for handlers
   - Automated IoT sensor integration

3. **Analytics**
   - Supply chain analytics dashboard
   - Bottleneck identification
   - Quality control metrics
   - Consumer engagement statistics

4. **Mobile App**
   - Native QR scanner
   - Offline scanning capability
   - Push notifications for status updates

## Testing

### Manual Testing

1. **Create a wine lot**
2. **Update status** through production lifecycle
3. **Mint bottles**
4. **Update bottle status** with various scan types
5. **Scan QR code** to verify traceability
6. **Check blockchain** verification (when implemented)

### API Testing

```bash
# Update lot status
curl -X POST \
  https://your-project.supabase.co/functions/v1/wine-lots-update-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token_id":"uuid","status":"bottled","location":"Bodega"}'

# Get lot history (public)
curl https://your-project.supabase.co/functions/v1/wine-lots-get-history?token_id=uuid

# Mint bottles
curl -X POST \
  https://your-project.supabase.co/functions/v1/wine-bottles-mint \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token_id":"uuid"}'

# Get bottle traceability (public)
curl https://your-project.supabase.co/functions/v1/wine-bottles-get-traceability?qr_code=WINE-123
```

## Support

For issues or questions:
1. Check database logs: `supabase logs`
2. Check edge function logs: `supabase functions logs`
3. Verify RLS policies are enabled
4. Confirm user has correct permissions

## Summary

The wine traceability system provides:

✅ **Two-level tracking**: Lot and bottle level  
✅ **Hybrid architecture**: Database + Blockchain  
✅ **Production lifecycle**: Full status tracking  
✅ **QR code integration**: Easy consumer verification  
✅ **Public transparency**: Anyone can verify authenticity  
✅ **Real-time updates**: Subscription support  
✅ **Secure**: RLS policies and authorization  
✅ **Scalable**: Batch operations for large lots  

The system is production-ready for lot-level tracking. Bottle-level NFTs are ready for when blockchain contracts are deployed.

