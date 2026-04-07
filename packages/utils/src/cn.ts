type ClassDictionary = Record<string, boolean | null | undefined>;
type ClassArray = ClassValue[];
type ClassValue = string | number | null | undefined | boolean | ClassDictionary | ClassArray;

/**
 * Lightweight class joiner for shared packages.
 * The UI layer can still compose tailwind-merge or clsx on top if needed.
 */
export function cn(...inputs: ClassValue[]): string {
  const result: string[] = [];

  const pushValue = (value: ClassValue) => {
    if (!value) return;

    if (typeof value === 'string' || typeof value === 'number') {
      result.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(pushValue);
      return;
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) result.push(key);
      });
    }
  };

  inputs.forEach(pushValue);
  return result.join(' ');
}
