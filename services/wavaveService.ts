
import { 
  WavavePairingCodeRequest, 
  WavavePairingCodeSuccessResponse, 
  WavaveScanQrSuccessResponse,
  WavaveSendMessageRequest,
  WavaveSendMessageSuccessResponse,
  WavaveApiErrorResponse,
  WavaveApiResponse
} from '../types';

// IMPORTANT: Storing API keys directly in frontend code is a significant security risk.
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg1MWUyNmExYTYxZjI3Y2UzNjRlMDhhODVkYjcwOGFhOmJhZWRhNTA2YmMzYjZjOWVjNDdlNGQzMjE5NTM3MWUwIiwiZXhwIjoxNzY0NTQ3MjAwLCJpYXQiOjE3NDg2OTk2MjF9.OluiMabPWVGibHuaIwWiwys0eiFsuCNIuQOk07LBfvw";
const API_BASE_URL = 'https://api.wavave.com/v1';
const API_ENDPOINT_DEVICE_PAIRING_CODE = `${API_BASE_URL}/device/pairingcode`;
const API_ENDPOINT_DEVICE_SCAN_QR = `${API_BASE_URL}/device/scanqr`;
const API_ENDPOINT_SEND_MESSAGE = `${API_BASE_URL}/send`;

// Generalized API call function
const makeWavaveApiCall = async (
  endpoint: string, 
  payload: Record<string, any>
): Promise<WavavePairingCodeSuccessResponse | WavaveScanQrSuccessResponse | WavaveSendMessageSuccessResponse> => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData: WavaveApiResponse = await response.json();

    if (!response.ok) {
      // Try to extract a meaningful message from various possible error fields
      const errorResponse = responseData as WavaveApiErrorResponse;
      const message = errorResponse?.message || 
                      (errorResponse as any)?.error || // Some APIs use 'error' field
                      errorResponse?.details?.toString() ||
                      `API Error: ${response.status} ${response.statusText}`;
      // Include code if available
      const fullMessage = errorResponse?.code ? `${message} (Code: ${errorResponse.code})` : message;
      throw new Error(fullMessage);
    }

    if (responseData.success) {
      // Type assertion here relies on the calling function knowing which endpoint was hit
      // and thus what success response structure to expect.
      return responseData as (WavavePairingCodeSuccessResponse | WavaveScanQrSuccessResponse | WavaveSendMessageSuccessResponse);
    } else {
      // Handle cases where response.ok is true, but responseData.success is false
      const errorResponse = responseData as WavaveApiErrorResponse;
      const message = errorResponse.message || 
                      (errorResponse as any)?.error ||
                      errorResponse?.details?.toString() ||
                      'API request indicated failure (success: false).';
      const fullMessage = errorResponse?.code ? `${message} (Code: ${errorResponse.code})` : message;
      throw new Error(fullMessage);
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Wavave API call to ${endpoint} failed:`, error.message);
      throw error; 
    }
    console.error(`Wavave API call to ${endpoint} failed with unknown error:`, error);
    throw new Error('An unexpected error occurred while processing your request.');
  }
};

export const getWavavePairingCode = async (deviceNumber: string): Promise<WavavePairingCodeSuccessResponse> => {
  const payload: WavavePairingCodeRequest = { device: deviceNumber };
  return await makeWavaveApiCall(API_ENDPOINT_DEVICE_PAIRING_CODE, payload) as WavavePairingCodeSuccessResponse;
};

export const getWavaveScanQr = async (deviceNumber: string): Promise<WavaveScanQrSuccessResponse> => {
  const payload: WavavePairingCodeRequest = { device: deviceNumber };
  return await makeWavaveApiCall(API_ENDPOINT_DEVICE_SCAN_QR, payload) as WavaveScanQrSuccessResponse;
};

export const sendWavaveMessage = async (messageData: WavaveSendMessageRequest): Promise<WavaveSendMessageSuccessResponse> => {
  // Ensure URL is only sent if Type is 'media'
  const payload: WavaveSendMessageRequest = { ...messageData };
  if (payload.Type !== 'media') {
    delete payload.url;
  }
  if (payload.delay === '') delete payload.delay; // API might expect number or "random", not empty string
  if (payload.callbackStatus === '') delete payload.callbackStatus;


  return await makeWavaveApiCall(API_ENDPOINT_SEND_MESSAGE, payload) as WavaveSendMessageSuccessResponse;
};
