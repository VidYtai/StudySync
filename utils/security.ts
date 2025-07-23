
/**
 * A utility function to securely hash a string using the Web Crypto API's SHA-256 algorithm.
 * @param {string} str The string to hash.
 * @returns {Promise<string>} A promise that resolves to the hex representation of the hash.
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert each byte to a 2-digit hex string
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
