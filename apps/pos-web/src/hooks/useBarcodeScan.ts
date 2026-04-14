/**
 * useBarcodeScan — listens for hardware barcode scanner input.
 *
 * Hardware scanners behave like a fast keyboard: they type the barcode
 * digits and then send an Enter key, all within ~50ms. This hook
 * distinguishes scanner input from manual typing by measuring inter-
 * keystroke timing.
 *
 * Usage:
 *   useBarcodeScan((barcode) => addItemByBarcode(barcode));
 *
 * Works globally (attached to document) — no focus required on a specific input.
 * Automatically paused when a text input or textarea has focus (prevents
 * double-firing when the cashier is typing in the search box).
 */
import { useEffect, useRef, useCallback } from 'react';

const SCAN_THRESHOLD_MS = 50;  // max ms between chars from scanner
const MIN_BARCODE_LEN   = 4;   // ignore very short sequences

export function useBarcodeScan(onScan: (barcode: string) => void) {
  const bufferRef   = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // If focus is in a text input, let the user type normally
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();

      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';
        lastKeyTime.current = 0;

        if (barcode.length >= MIN_BARCODE_LEN) {
          onScan(barcode);
        }
        return;
      }

      // Only accumulate printable single characters
      if (e.key.length !== 1) return;

      const timeSinceLast = now - lastKeyTime.current;

      // If too slow, it's manual typing — reset buffer
      if (lastKeyTime.current > 0 && timeSinceLast > SCAN_THRESHOLD_MS * 3) {
        bufferRef.current = '';
      }

      bufferRef.current += e.key;
      lastKeyTime.current = now;
    },
    [onScan],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
