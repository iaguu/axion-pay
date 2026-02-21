const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY || "axionpay-secret";

function xorCipher(value, key) {
  const output = [];
  for (let i = 0; i < value.length; i += 1) {
    const charCode = value.charCodeAt(i);
    const keyCode = key.charCodeAt(i % key.length);
    output.push(String.fromCharCode(charCode ^ keyCode));
  }
  return output.join("");
}

export function setSecureJson(key, payload) {
  const stringified = JSON.stringify(payload);
  const ciphered = xorCipher(stringified, SECRET_KEY);
  localStorage.setItem(key, btoa(ciphered));
}

export function getSecureJson(key) {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    const decoded = atob(stored);
    const deciphered = xorCipher(decoded, SECRET_KEY);
    return JSON.parse(deciphered);
  } catch (err) {
    console.error("Failed to parse secure storage", err);
    return null;
  }
}
