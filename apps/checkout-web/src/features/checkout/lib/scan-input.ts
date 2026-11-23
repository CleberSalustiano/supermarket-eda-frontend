export type ScanInputResult =
  | { ok: true; barcode: string; quantity: number }
  | { ok: false; error: 'scanner.formatError' };

const MAX_QUANTITY = 999;
const MAX_BARCODE_LENGTH = 64;
const quantityPattern = /^\d+$/;

const invalid: ScanInputResult = { ok: false, error: 'scanner.formatError' };

/** Parses `code` or `quantity*code`. The quantity must be an integer from 1 to 999. */
export function parseScanInput(text: string): ScanInputResult {
  const trimmed = text.trim();
  const separatorIndex = trimmed.indexOf('*');

  if (separatorIndex === -1) {
    return isValidBarcode(trimmed) ? { ok: true, barcode: trimmed, quantity: 1 } : invalid;
  }

  const quantityText = trimmed.slice(0, separatorIndex).trim();
  const barcode = trimmed.slice(separatorIndex + 1).trim();

  if (!quantityPattern.test(quantityText) || !isValidBarcode(barcode)) {
    return invalid;
  }

  const quantity = Number.parseInt(quantityText, 10);

  return quantity >= 1 && quantity <= MAX_QUANTITY ? { ok: true, barcode, quantity } : invalid;
}

function isValidBarcode(barcode: string): boolean {
  return barcode.length > 0 && barcode.length <= MAX_BARCODE_LENGTH && !barcode.includes('*');
}
