export type MicBlockReason =
  | 'secure-context'
  | 'embedded'
  | 'api-missing'
  | 'permission-denied'
  | 'no-device'
  | null;

export function isAppEmbedded(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function micApiAvailable(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  if (typeof navigator.mediaDevices?.getUserMedia === 'function') return true;
  const nav = navigator as Navigator & {
    getUserMedia?: (...args: unknown[]) => void;
    webkitGetUserMedia?: (...args: unknown[]) => void;
  };
  return typeof nav.getUserMedia === 'function' || typeof nav.webkitGetUserMedia === 'function';
}

export function describeMicEnvironment(): { available: boolean; reason: MicBlockReason; hint: string } {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'api-missing', hint: '' };
  }
  if (!window.isSecureContext) {
    return {
      available: false,
      reason: 'secure-context',
      hint: 'Microphone requires HTTPS. Open the app at its https://…apps.lemma.work URL.',
    };
  }
  if (isAppEmbedded()) {
    return {
      available: false,
      reason: 'embedded',
      hint:
        'The mic is turned off inside an embedded app panel. Open CareerPilot in a full browser tab (button below), then allow the microphone.',
    };
  }
  if (!micApiAvailable()) {
    return {
      available: false,
      reason: 'api-missing',
      hint: 'This browser does not expose microphone access. Use Chrome or Edge on desktop, or type your answer in text mode.',
    };
  }
  return { available: true, reason: null, hint: '' };
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  };

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  const nav = navigator as Navigator & {
    getUserMedia?: (
      c: MediaStreamConstraints,
      ok: (s: MediaStream) => void,
      err: (e: unknown) => void,
    ) => void;
    webkitGetUserMedia?: (
      c: MediaStreamConstraints,
      ok: (s: MediaStream) => void,
      err: (e: unknown) => void,
    ) => void;
  };
  const legacy = nav.getUserMedia ?? nav.webkitGetUserMedia;
  if (!legacy) {
    throw new DOMException('Microphone API not available', 'NotSupportedError');
  }

  return new Promise((resolve, reject) => {
    legacy.call(navigator, constraints, resolve, reject);
  });
}

export function micErrorMessage(err: unknown): string {
  if (isAppEmbedded()) {
    return describeMicEnvironment().hint;
  }
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return 'Microphone blocked. Click the lock icon in the address bar → Site settings → allow Microphone, then reload.';
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return 'No microphone detected. Connect a mic or pick an input in Windows sound settings.';
    }
    if (err.name === 'NotSupportedError' || err.name === 'SecurityError') {
      return describeMicEnvironment().hint || 'Microphone is not available in this context.';
    }
  }
  return 'Could not open the microphone. Try opening the app in Chrome/Edge in a full tab.';
}

export function openAppInNewTab(): void {
  window.open(window.location.href, '_blank', 'noopener,noreferrer');
}
