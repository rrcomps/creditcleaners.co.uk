export function validateEmail(v: string): boolean {
  return (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/).test(v.trim());
}

export function validateUKMobile(v: string): boolean {
  const cleaned = v.replace(/[^0-9+]/g, "").replace(/^00/, "+");
  const compact = cleaned.replace(/\s+/g, "");
  return (/^(\+44?7\d{9}|07\d{9})$/).test(compact);
}

export function validatePostcode(v: string): boolean {
  const s = v.trim().toUpperCase();
  if (!s) return true; // optional
  return (/^(GIR 0AA|[A-PR-UWYZ][A-HK-Y]?\d[ABEHMNPRV-Y\d]?\s?\d[ABD-HJLN-UW-Z]{2})$/i).test(s);
}

export function validateFullName(v: string): boolean {
  const s = v.trim();
  if (!s) return false;
  const parts = s.split(/\s+/);
  return parts.length >= 2 && parts[0].length >= 2 && parts[1].length >= 2;
}
