import CryptoJS from "crypto-js";

// A secret key for encryption (in a real app, this should be an env variable, 
// but for client-side sharing, it just needs to be consistent)
const SECRET_KEY = "draw-guess-share-secret";

export function encryptRoomId(roomId) {
  if (!roomId) return "";
  // Use AES encryption
  const encrypted = CryptoJS.AES.encrypt(roomId, SECRET_KEY).toString();
  // Make it URL safe
  return encodeURIComponent(encrypted);
}

export function decryptRoomId(hash) {
  if (!hash) return "";
  try {
    // Decode from URL safe format
    const decoded = decodeURIComponent(hash);
    const bytes = CryptoJS.AES.decrypt(decoded, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch (e) {
    console.error("Decryption failed", e);
    return null;
  }
}
