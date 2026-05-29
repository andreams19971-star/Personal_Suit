// useBiometric.js
// Maneja registro y autenticación con Face ID / Touch ID via WebAuthn

const CRED_KEY = "suite_biometric_cred";

// Verifica si el dispositivo soporta WebAuthn
export function isBiometricSupported() {
  return !!(window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === "function");
}

// Genera un challenge aleatorio
function randomChallenge() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

// Convierte ArrayBuffer a base64url para guardar en localStorage
function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Convierte base64url de vuelta a Uint8Array
function b64ToBuf(b64) {
  const str = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf;
}

// Registrar biométrica (primera vez)
export async function registerBiometric(userName) {
  if (!isBiometricSupported()) throw new Error("WebAuthn no soportado");

  const challenge = randomChallenge();
  const userId     = new Uint8Array(16);
  crypto.getRandomValues(userId);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Mi Suite Personal", id: window.location.hostname },
      user: { id: userId, name: userName || "usuario", displayName: userName || "usuario" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7  }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // solo biométrica del dispositivo
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    }
  });

  // Guardar el credentialId para futura autenticación
  const credId = bufToB64(credential.rawId);
  localStorage.setItem(CRED_KEY, credId);
  return credId;
}

// Autenticar con biométrica
export async function authenticateBiometric() {
  if (!isBiometricSupported()) throw new Error("WebAuthn no soportado");

  const credId = localStorage.getItem(CRED_KEY);
  const allowCredentials = credId
    ? [{ type: "public-key", id: b64ToBuf(credId), transports: ["internal"] }]
    : [];

  const challenge = randomChallenge();
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials,
      userVerification: "required",
      timeout: 60000,
    }
  });

  // Si llegamos aquí, Face ID / Touch ID fue exitoso
  return !!assertion;
}

// Verificar si ya hay biométrica registrada
export function hasBiometricRegistered() {
  return !!localStorage.getItem(CRED_KEY);
}

// Borrar biométrica registrada
export function removeBiometric() {
  localStorage.removeItem(CRED_KEY);
}
