'use client'

/**
 * Sets a value in localStorage with an expiry timestamp (next midnight).
 * @param key The key to store the data under.
 * @param data The data to store.
 */
export const setCache = (key: string, data: any) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const now = new Date();
    const expiry = new Date(now);
    expiry.setHours(24, 0, 0, 0); // Set expiry to next midnight

    const item = {
      data: data,
      expiry: expiry.getTime(),
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

/**
 * Gets a value from localStorage if it exists and has not expired.
 * @param key The key of the data to retrieve.
 * @returns The cached data or null if not found or expired.
 */
export const getCache = (key: string): any | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch (error) {
    console.error('Error getting cache:', error);
    return null;
  }
};
