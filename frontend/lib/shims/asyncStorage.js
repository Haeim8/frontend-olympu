const store = new Map();

const AsyncStorage = {
  setItem: async (key, value) => {
    store.set(String(key), String(value));
    return null;
  },
  getItem: async (key) => {
    const value = store.get(String(key));
    return value ?? null;
  },
  removeItem: async (key) => {
    store.delete(String(key));
    return null;
  },
  clear: async () => {
    store.clear();
    return null;
  },
  getAllKeys: async () => Array.from(store.keys()),
  multiGet: async (keys = []) => keys.map((key) => [key, store.get(String(key)) ?? null]),
  multiSet: async (entries = []) => {
    entries.forEach(([key, value]) => {
      store.set(String(key), String(value));
    });
    return null;
  },
  multiRemove: async (keys = []) => {
    keys.forEach((key) => {
      store.delete(String(key));
    });
    return null;
  },
};

export default AsyncStorage;
export { AsyncStorage };
