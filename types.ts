
export interface WavavePairingCodeRequest {
  device: string; // Nomor whatsapp
}

// For Pairing Code
export interface WavavePairingCodeSuccessData {
  device: string;
  code: string;
}

export interface WavavePairingCodeSuccessResponse {
  success: true;
  status: string; // e.g., "pending"
  data: WavavePairingCodeSuccessData;
}

// For QR Scan
export interface WavaveScanQrSuccessData {
  device: string;
  qr: string; // base64 image string
}

export interface WavaveScanQrSuccessResponse {
  success: true;
  status: string; // e.g., "pending"
  data: WavaveScanQrSuccessData;
}

// For Send Message
export interface WavaveSendMessageRequest {
  from: string;
  to: string;
  message: string;
  Type: 'text' | 'media';
  url?: string; // Required if Type is 'media'
  callbackStatus?: string;
  typing?: boolean;
  delay?: string | number; // number or "random"
}

export interface WavaveSendMessageSuccessData {
  status: string; // e.g., "pending"
  requestId: string;
  to: string;
  code: number; // e.g., 200
}

export interface WavaveSendMessageSuccessResponse {
  success: true;
  message: string; // e.g., "Success"
  data: WavaveSendMessageSuccessData;
}


// Common Error Response
export interface WavaveApiErrorResponse {
  success: false;
  message: string; // This can be "Gagal mengirim pesan", "Api key tidak valid", etc.
  status_code?: number; // HTTP status code if available from server
  error?: string; // Sometimes 'error' field might be used for error type e.g. "error", "invalid"
  status?: string; // As seen in error table: "error", "invalid", "failed", "disconnect", "expired", "throttled"
  code?: number; // As seen in error table: 500, 415, 400, 401, 503, 403, 429, 413
  details?: any;
}

// Union type for API responses from wavaveService
export type WavaveApiResponse = 
  | WavavePairingCodeSuccessResponse 
  | WavaveScanQrSuccessResponse 
  | WavaveSendMessageSuccessResponse
  | WavaveApiErrorResponse;

// For Incoming Message Webhook
// Based on: https://api.wavave.com/docs/webhook (Pesan text masuk example)
export interface WavaveIncomingMessagePayload {
  device: string;         // "62812345678"
  from: string;           // "62812345678"
  profilename: string;    // "Wa Vave"
  messagebody: string;    // "Halo apa kabar hari ini?"
  isForwarded: boolean;   // false
  messageid: string;      // "3EB0F7E3D4B071944518E3"
  type: string;           // "text", "textreply", "imagereply", "image", "video", "document", "audio", "sticker", "location", "interactive", "reaction"
  dataMedia?: any;        // Optional, structure depends on media type
  group?: any;            // Optional, structure if message is from a group
  button?: any;           // Optional, for button reply messages
  CatalogDetails?: any;   // Optional
  dataforwarded?: any;    // Optional
  locationName?: string;  // Optional
  Latitude?: string;      // Optional
  Longitude?: string;     // Optional
  reactionsid?: string;   // Optional
  deviceStatus?: string;  // Optional, e.g. if the webhook is for device status change
  code?: string | number; // Optional
  reason?: string;        // Optional
  status?: string;        // Optional (e.g., for device status webhooks)
}
