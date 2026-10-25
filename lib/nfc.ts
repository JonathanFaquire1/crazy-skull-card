export const pendingNfcKey = 'pending_nfc_code'
export function normalizeNfcCode(value: string | null): string | null {
  const code = value?.trim().toUpperCase()
  return code && /^SKU[0-9]{5}$/.test(code) ? code : null
}
