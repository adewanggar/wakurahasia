
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { getWavavePairingCode, getWavaveScanQr, sendWavaveMessage } from './services/wavaveService';
import { 
  WavavePairingCodeSuccessResponse, 
  WavaveScanQrSuccessResponse,
  WavaveSendMessageRequest,
  WavaveSendMessageSuccessResponse,
  WavaveIncomingMessagePayload
} from './types';
import { 
  PhoneIcon, KeyIcon, LoadingSpinnerIcon, AlertTriangleIcon, 
  CheckCircleIcon, QrCodeIcon, PaperAirplaneIcon, MessageIcon, LinkIcon, CodeBracketIcon,
  InboxIcon, JsonIcon // Using simpler InboxIcon
} from './components/Icons';

type PairingSubMode = 'code' | 'qr';
type MainView = 'pairing' | 'sendMessage' | 'webhookViewer';

// --- UI Components (Moved Outside App function) ---
const ViewModeButton: React.FC<{view: MainView, currentView: MainView, onClick: () => void, children: React.ReactNode, icon?: React.ReactNode}> = 
  ({ view, currentView, onClick, children, icon }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 flex items-center justify-center space-x-2
      ${view === currentView 
        ? 'bg-purple-600 text-white shadow-lg' 
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600/80'
      }`}
    aria-pressed={view === currentView}
  >
    {icon}
    <span>{children}</span>
  </button>
);

const SubModeButton: React.FC<{mode: PairingSubMode, currentMode: PairingSubMode, onClick: () => void, children: React.ReactNode}> = 
  ({ mode, currentMode, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:ring-offset-gray-700
      ${mode === currentMode 
        ? 'bg-purple-500 text-white shadow-md' 
        : 'bg-gray-600 text-gray-300 hover:bg-gray-500/70'
      }`}
  >
    {children}
  </button>
);

const InputField: React.FC<{id: string, name: string, label: string, value?: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void, type?: string, placeholder?: string, Icon?: React.FC<React.SVGProps<SVGSVGElement>>, helpText?: string, required?: boolean, disabled?: boolean, rows?: number, isCheckbox?: boolean, checked?: boolean, options?: {value:string, label:string}[]}> = 
  ({id, name, label, value, onChange, type="text", placeholder, Icon, helpText, required, disabled, rows, isCheckbox, checked, options}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <div className="relative">
      {Icon && !isCheckbox && type !== 'textarea' && type !== 'select' && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      )}
       {Icon && (type === 'textarea' || type === 'select') && ( // Icon for textarea/select usually outside or styled differently
        <div className="absolute top-3.5 left-0 pl-3.5 flex items-center pointer-events-none">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
      )}
      {isCheckbox ? (
          <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer">
              <input
                  type="checkbox"
                  id={id}
                  name={name}
                  checked={!!checked}
                  onChange={onChange}
                  className="h-5 w-5 rounded text-purple-500 bg-gray-600 border-gray-500 focus:ring-purple-500 focus:ring-offset-gray-800 cursor-pointer"
                  disabled={disabled}
              />
               <span className="text-gray-300">{helpText}</span>
          </label>
      ) : type === 'textarea' ? (
        <textarea
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows || 3}
          className={`block w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-150 ease-in-out shadow-sm`}
          disabled={disabled}
          required={required}
        />
      ) : type === 'select' && options ? (
         <select
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          className={`block w-full ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-150 ease-in-out shadow-sm appearance-none`}
          disabled={disabled}
          required={required}
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          className={`block w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 bg-gray-700/60 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-150 ease-in-out shadow-sm`}
          disabled={disabled}
          required={required}
        />
      )}
    </div>
    {helpText && !isCheckbox && <p className="mt-1.5 text-xs text-gray-500">{helpText}</p>}
  </div>
);

const JsonDisplay: React.FC<{ data: any }> = ({ data }) => {
  if (data === null || typeof data === 'undefined') {
    return null;
  }
  return (
    <pre className="text-left text-xs md:text-sm bg-gray-800/70 p-4 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};


function App() {
  // Main view state
  const [currentView, setCurrentView] = useState<MainView>('pairing');

  // Pairing states
  const [pairingSubMode, setPairingSubMode] = useState<PairingSubMode>('code');
  const [pairingPhoneNumber, setPairingPhoneNumber] = useState<string>('');
  const [pairingCodeResponse, setPairingCodeResponse] = useState<WavavePairingCodeSuccessResponse | null>(null);
  const [qrScanResponse, setQrScanResponse] = useState<WavaveScanQrSuccessResponse | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isPairingLoading, setIsPairingLoading] = useState<boolean>(false);

  // Send Message states
  const [sendMessageForm, setSendMessageForm] = useState<WavaveSendMessageRequest>({
    from: '6281772398630', 
    to: '',
    message: '',
    Type: 'text',
    url: '',
    callbackStatus: '',
    typing: true,
    delay: '5',
  });
  const [sendMessageResponse, setSendMessageResponse] = useState<WavaveSendMessageSuccessResponse | null>(null);
  const [sendMessageError, setSendMessageError] = useState<string | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);

  // Webhook Viewer states
  const [webhookJsonInput, setWebhookJsonInput] = useState<string>('');
  const [parsedWebhookPayload, setParsedWebhookPayload] = useState<WavaveIncomingMessagePayload | null>(null);
  const [webhookParseError, setWebhookParseError] = useState<string | null>(null);

  const validatePhoneNumber = (num: string): boolean => {
    return /^62\d{8,13}$/.test(num); 
  };

  // --- Pairing Logic ---
  const handlePairingSubModeChange = useCallback((newMode: PairingSubMode) => {
    setPairingSubMode(newMode);
    setPairingError(null);
    setPairingCodeResponse(null);
    setQrScanResponse(null);
  }, []); 

  const handlePairingSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPairingError(null);
    setPairingCodeResponse(null);
    setQrScanResponse(null);

    if (!validatePhoneNumber(pairingPhoneNumber)) {
      setPairingError('Invalid phone number. Format: 62XXXXXXXXXX (e.g., 6281234567890). Total 10-15 digits.');
      return;
    }

    setIsPairingLoading(true);
    try {
      if (pairingSubMode === 'code') {
        const result = await getWavavePairingCode(pairingPhoneNumber);
        setPairingCodeResponse(result);
      } else { 
        const result = await getWavaveScanQr(pairingPhoneNumber);
        setQrScanResponse(result);
      }
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsPairingLoading(false);
    }
  }, [pairingPhoneNumber, pairingSubMode]);

  // --- Send Message Logic ---
  const handleSendMessageFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const targetType = (e.target as HTMLInputElement).type;
    const targetChecked = (e.target as HTMLInputElement).checked;

    setSendMessageForm(prevForm => {
      const updatedValue = targetType === 'checkbox' ? targetChecked : value;
      const newForm = {
        ...prevForm,
        [name]: updatedValue,
      };

      if (name === "Type" && value === "text") {
        newForm.url = ''; 
      }
      return newForm;
    });
  }, []); 

  const handleSendMessageSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendMessageError(null);
    setSendMessageResponse(null);

    if (!validatePhoneNumber(sendMessageForm.from)) {
      setSendMessageError('Invalid "From" phone number. Format: 62XXXXXXXXXX.');
      return;
    }
    if (!validatePhoneNumber(sendMessageForm.to)) {
      setSendMessageError('Invalid "To" phone number. Format: 62XXXXXXXXXX.');
      return;
    }
    if (!sendMessageForm.message.trim()) {
      setSendMessageError('Message cannot be empty.');
      return;
    }
    if (sendMessageForm.Type === 'media' && !sendMessageForm.url?.trim()) {
      setSendMessageError('Media URL is required for media type messages.');
      return;
    }
    const delayVal = sendMessageForm.delay?.toString().trim();
    if (delayVal && delayVal !== "random") {
        const numericDelay = parseInt(delayVal, 10);
        if (isNaN(numericDelay) || numericDelay < 1 || numericDelay > 18000) {
            setSendMessageError('Delay must be a number between 1 and 18000, or "random".');
            return;
        }
    }

    setIsSendingMessage(true);
    try {
      const payload: WavaveSendMessageRequest = {
        ...sendMessageForm,
        delay: sendMessageForm.delay?.toString().trim() === '' ? undefined : sendMessageForm.delay,
        callbackStatus: sendMessageForm.callbackStatus?.trim() === '' ? undefined : sendMessageForm.callbackStatus,
      };
      if (payload.Type !== 'media') delete payload.url;

      const result = await sendWavaveMessage(payload);
      setSendMessageResponse(result);
    } catch (err) {
      setSendMessageError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSendingMessage(false);
    }
  }, [sendMessageForm]); 
  
  // --- Webhook Viewer Logic ---
  const handleWebhookJsonInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonInput = e.target.value;
    setWebhookJsonInput(newJsonInput);
    if (newJsonInput.trim() === '') {
      setParsedWebhookPayload(null);
      setWebhookParseError(null);
      return;
    }
    try {
      const parsed = JSON.parse(newJsonInput);
      setParsedWebhookPayload(parsed as WavaveIncomingMessagePayload); // Assume it matches the type
      setWebhookParseError(null);
    } catch (error) {
      setParsedWebhookPayload(null);
      setWebhookParseError('Invalid JSON: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col items-center justify-center p-4 text-slate-200 selection:bg-purple-500 selection:text-white">
      <div className="bg-gray-800 shadow-2xl rounded-xl p-6 md:p-8 w-full max-w-lg border border-gray-700/50 transform transition-all duration-500 hover:scale-[1.01]">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-purple-500">
              Wavave API Client
            </span>
          </h1>
        </header>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-6">
          <ViewModeButton view="pairing" currentView={currentView} onClick={() => setCurrentView('pairing')} icon={<CodeBracketIcon className="w-5 h-5"/>}>
            Device Pairing
          </ViewModeButton>
          <ViewModeButton view="sendMessage" currentView={currentView} onClick={() => setCurrentView('sendMessage')} icon={<PaperAirplaneIcon className="w-5 h-5"/>}>
            Send Message
          </ViewModeButton>
          <ViewModeButton view="webhookViewer" currentView={currentView} onClick={() => setCurrentView('webhookViewer')} icon={<InboxIcon className="w-5 h-5"/>}>
            Webhook Viewer
          </ViewModeButton>
        </div>

        {/* --- Device Pairing View --- */}
        {currentView === 'pairing' && (
          <section aria-labelledby="pairing-heading" className="animate-fadeIn">
            <h2 id="pairing-heading" className="text-xl font-semibold text-center text-gray-300 mb-1">Device Pairing</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Get a pairing code or QR to link your WhatsApp.</p>
            
            <div className="flex space-x-3 mb-6 bg-gray-700 p-1 rounded-lg">
              <SubModeButton mode="code" currentMode={pairingSubMode} onClick={() => handlePairingSubModeChange('code')}>
                Pairing Code
              </SubModeButton>
              <SubModeButton mode="qr" currentMode={pairingSubMode} onClick={() => handlePairingSubModeChange('qr')}>
                QR Scan
              </SubModeButton>
            </div>

            <form onSubmit={handlePairingSubmit} className="space-y-6">
              <InputField 
                id="pairingPhoneNumber"
                name="pairingPhoneNumber"
                label="Phone Number (e.g., 6281234567890)"
                value={pairingPhoneNumber}
                onChange={(e) => setPairingPhoneNumber(e.target.value)}
                placeholder="62..."
                Icon={PhoneIcon}
                helpText="Must start with country code '62'."
                disabled={isPairingLoading}
                required
              />
              <button
                type="submit"
                disabled={isPairingLoading || !pairingPhoneNumber}
                className="w-full flex items-center justify-center bg-gradient-to-r from-sky-500 to-purple-600 hover:from-sky-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed active:transform active:scale-95"
                aria-live="polite"
              >
                {isPairingLoading ? (
                  <><LoadingSpinnerIcon className="mr-2.5 h-5 w-5" /> Processing...</>
                ) : pairingSubMode === 'code' ? (
                  <><KeyIcon className="mr-2.5 h-5 w-5" /> Get Pairing Code</>
                ) : (
                  <><QrCodeIcon className="mr-2.5 h-5 w-5" /> Get QR Code</>
                )}
              </button>
            </form>

            {pairingError && (
              <div role="alert" className="mt-6 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-700/70 flex items-start shadow-lg animate-fadeIn">
                <AlertTriangleIcon className="w-6 h-6 mr-3 flex-shrink-0 text-red-400 mt-0.5" />
                <div><h3 className="font-semibold text-red-200">Request Failed</h3><p className="text-sm break-words">{pairingError}</p></div>
              </div>
            )}

            {pairingSubMode === 'code' && pairingCodeResponse && !pairingError && (
              <div className="mt-6 p-5 bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/60 animate-fadeIn">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center"><CheckCircleIcon className="w-6 h-6 mr-2 text-green-400" />Pairing Code Ready</h3>
                <div className="space-y-3">
                  <div><p className="text-xs text-gray-400">API Status</p><p className="text-md text-gray-100 bg-gray-800/70 p-2 rounded-md">{pairingCodeResponse.status}</p></div>
                  <div><p className="text-xs text-gray-400">Device</p><p className="text-md font-mono text-sky-300 bg-gray-800/70 p-2 rounded-md break-all">{pairingCodeResponse.data.device}</p></div>
                  <div><p className="text-xs text-gray-400">Code</p><p className="text-xl font-bold font-mono text-purple-300 bg-gray-800/70 p-2 rounded-md tracking-wider break-all">{pairingCodeResponse.data.code}</p></div>
                </div>
              </div>
            )}

            {pairingSubMode === 'qr' && qrScanResponse && !pairingError && (
              <div className="mt-6 p-5 bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/60 animate-fadeIn">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center"><CheckCircleIcon className="w-6 h-6 mr-2 text-green-400" />QR Code Ready</h3>
                <div className="space-y-3">
                  <div><p className="text-xs text-gray-400">API Status</p><p className="text-md text-gray-100 bg-gray-800/70 p-2 rounded-md">{qrScanResponse.status}</p></div>
                  <div><p className="text-xs text-gray-400">Device</p><p className="text-md font-mono text-sky-300 bg-gray-800/70 p-2 rounded-md break-all">{qrScanResponse.data.device}</p></div>
                  <div className="text-center"><p className="text-xs text-gray-400 mb-1">Scan QR Code</p><div className="mt-1 p-2 bg-white rounded-lg shadow-sm inline-block"><img src={qrScanResponse.data.qr} alt="WhatsApp QR Code" className="w-48 h-48 object-contain"/></div></div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* --- Send Message View --- */}
        {currentView === 'sendMessage' && (
          <section aria-labelledby="send-message-heading" className="animate-fadeIn">
            <h2 id="send-message-heading" className="text-xl font-semibold text-center text-gray-300 mb-1">Send WhatsApp Message</h2>
             <p className="text-sm text-gray-400 text-center mb-6">Compose and send a message via Wavave API.</p>
            <form onSubmit={handleSendMessageSubmit} className="space-y-5">
              <InputField id="from" name="from" label="From (Your WhatsApp Number)" value={sendMessageForm.from} onChange={handleSendMessageFormChange} Icon={PhoneIcon} placeholder="62..." helpText="Must start with '62'." required disabled={isSendingMessage} />
              <InputField id="to" name="to" label="To (Recipient's WhatsApp Number)" value={sendMessageForm.to} onChange={handleSendMessageFormChange} Icon={PhoneIcon} placeholder="62..." helpText="Must start with '62'." required disabled={isSendingMessage} />
              <InputField id="message" name="message" label="Message" value={sendMessageForm.message} onChange={handleSendMessageFormChange} type="textarea" Icon={MessageIcon} placeholder="Enter your message..." required disabled={isSendingMessage} rows={3} />
              <InputField 
                id="Type" name="Type" label="Message Type" value={sendMessageForm.Type} onChange={handleSendMessageFormChange} type="select" 
                options={[{value: 'text', label: 'Text'}, {value: 'media', label: 'Media (Image, Document, etc.)'}]} 
                disabled={isSendingMessage} 
              />
              {sendMessageForm.Type === 'media' && (
                <InputField id="url" name="url" label="Media URL" value={sendMessageForm.url || ''} onChange={handleSendMessageFormChange} Icon={LinkIcon} placeholder="https://example.com/image.png" helpText="Publicly accessible URL for the media file." required={sendMessageForm.Type === 'media'} disabled={isSendingMessage} />
              )}
              <InputField id="callbackStatus" name="callbackStatus" label="Callback URL (Optional)" value={sendMessageForm.callbackStatus || ''} onChange={handleSendMessageFormChange} Icon={LinkIcon} placeholder="https://yourserver.com/webhook" helpText="Webhook to receive message status updates." disabled={isSendingMessage} />
              <div className="grid grid-cols-2 gap-4">
                <InputField id="delay" name="delay" label="Delay (sec / 'random')" value={sendMessageForm.delay?.toString() || ''} onChange={handleSendMessageFormChange} placeholder="e.g., 5 or random" helpText="1-18000 or 'random'." disabled={isSendingMessage} />
                <InputField id="typing" name="typing" label="Simulate Typing" checked={sendMessageForm.typing} onChange={handleSendMessageFormChange} isCheckbox helpText="Show as typing before send" disabled={isSendingMessage} />
              </div>
              
              <button
                type="submit"
                disabled={isSendingMessage || !sendMessageForm.from || !sendMessageForm.to || !sendMessageForm.message}
                className="w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed active:transform active:scale-95"
                aria-live="polite"
              >
                {isSendingMessage ? (
                  <><LoadingSpinnerIcon className="mr-2.5 h-5 w-5" /> Sending...</>
                ) : (
                  <><PaperAirplaneIcon className="mr-2.5 h-5 w-5" /> Send Message</>
                )}
              </button>
            </form>

            {sendMessageError && (
              <div role="alert" className="mt-6 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-700/70 flex items-start shadow-lg animate-fadeIn">
                <AlertTriangleIcon className="w-6 h-6 mr-3 flex-shrink-0 text-red-400 mt-0.5" />
                <div><h3 className="font-semibold text-red-200">Send Failed</h3><p className="text-sm break-words">{sendMessageError}</p></div>
              </div>
            )}

            {sendMessageResponse && !sendMessageError && (
              <div className="mt-6 p-5 bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/60 animate-fadeIn">
                <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center"><CheckCircleIcon className="w-6 h-6 mr-2 text-green-400" />Message Status</h3>
                <div className="space-y-3">
                  <div><p className="text-xs text-gray-400">Overall Status</p><p className="text-md text-gray-100 bg-gray-800/70 p-2 rounded-md">{sendMessageResponse.message}</p></div>
                  <div><p className="text-xs text-gray-400">Request ID</p><p className="text-md font-mono text-sky-300 bg-gray-800/70 p-2 rounded-md break-all">{sendMessageResponse.data.requestId}</p></div>
                  <div><p className="text-xs text-gray-400">Recipient</p><p className="text-md font-mono text-sky-300 bg-gray-800/70 p-2 rounded-md break-all">{sendMessageResponse.data.to}</p></div>
                  <div><p className="text-xs text-gray-400">Delivery Status</p><p className="text-md text-gray-100 bg-gray-800/70 p-2 rounded-md">{sendMessageResponse.data.status} (Code: {sendMessageResponse.data.code})</p></div>
                </div>
                <p className="mt-4 text-xs text-gray-500">Note: 'pending' means the request is queued. Use Callback URL for real-time delivery updates.</p>
              </div>
            )}
          </section>
        )}

        {/* --- Webhook Payload Viewer --- */}
        {currentView === 'webhookViewer' && (
           <section aria-labelledby="webhook-viewer-heading" className="animate-fadeIn">
            <h2 id="webhook-viewer-heading" className="text-xl font-semibold text-center text-gray-300 mb-1">Webhook Payload Viewer</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Paste a sample JSON payload from a Wavave webhook to inspect its structure.</p>
            
            <div className="space-y-5">
              <InputField 
                id="webhookJsonInput"
                name="webhookJsonInput"
                label="Webhook JSON Payload"
                value={webhookJsonInput}
                onChange={handleWebhookJsonInputChange}
                type="textarea"
                Icon={JsonIcon}
                placeholder='Paste your JSON payload here... e.g., {"device": "62...", "from": "62...", ...}'
                rows={8}
              />
            </div>

            {webhookParseError && (
              <div role="alert" className="mt-6 p-4 bg-red-900/50 text-red-300 rounded-lg border border-red-700/70 flex items-start shadow-lg animate-fadeIn">
                <AlertTriangleIcon className="w-6 h-6 mr-3 flex-shrink-0 text-red-400 mt-0.5" />
                <div><h3 className="font-semibold text-red-200">JSON Parsing Error</h3><p className="text-sm break-words">{webhookParseError}</p></div>
              </div>
            )}

            {parsedWebhookPayload && !webhookParseError && (
              <div className="mt-6 p-5 bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/60 animate-fadeIn">
                <h3 className="text-lg font-semibold text-sky-400 mb-4 flex items-center"><CheckCircleIcon className="w-6 h-6 mr-2 text-sky-400" />Parsed Webhook Data</h3>
                <JsonDisplay data={parsedWebhookPayload} />
              </div>
            )}
             <p className="mt-4 text-xs text-gray-500 text-center">
                This tool helps visualize webhook data. Actual webhooks must be sent to a server-side endpoint.
            </p>
          </section>
        )}

      </div>
      <footer className="text-center mt-8 mb-6 text-xs text-gray-500 px-4">
        <p>Wavave API Client &copy; {new Date().getFullYear()}</p>
        <p className="mt-1 max-w-md mx-auto">This is a frontend demonstration. For production, API keys should be managed securely on a backend server, not exposed in client-side code.</p>
      </footer>
    </div>
  );
}

export default App;
