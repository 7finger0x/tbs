/**
 * Crypto polyfills for browser compatibility
 * Provides crypto.randomUUID() for browsers that don't support it
 */

// Polyfill crypto.randomUUID if not available
if (typeof window !== 'undefined') {
  const globalCrypto = globalThis.crypto || (window as Window & { crypto?: Crypto }).crypto;
  
  if (globalCrypto && typeof globalCrypto === 'object' && 'getRandomValues' in globalCrypto && !('randomUUID' in globalCrypto)) {
    // Fallback implementation using crypto.getRandomValues
    // Use Object.defineProperty to avoid TypeScript type issues
    const cryptoObj = globalCrypto as Crypto & { getRandomValues: (array: Uint8Array) => Uint8Array };
    const getRandomValues = cryptoObj.getRandomValues;
    
    if (getRandomValues) {
      Object.defineProperty(cryptoObj, 'randomUUID', {
        value: function randomUUID(): string {
          // Generate UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
          const bytes = new Uint8Array(16);
          getRandomValues.call(cryptoObj, bytes);
          
        // Set version (4) and variant bits
        bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // Version 4
        bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // Variant 10
          
          // Convert to hex string
          const hex = Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Format as UUID
          return [
            hex.slice(0, 8),
            hex.slice(8, 12),
            hex.slice(12, 16),
            hex.slice(16, 20),
            hex.slice(20, 32),
          ].join('-') as `${string}-${string}-${string}-${string}-${string}`;
        },
        writable: true,
        configurable: true,
      });
    }
  }
}
