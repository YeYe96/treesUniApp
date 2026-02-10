const PREFIX = 'route_payload_';

const createKey = () => `${PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const saveRoutePayload = (payload) => {
  const key = createKey();
  uni.setStorageSync(key, payload);
  return key;
};

export const consumeRoutePayload = (key) => {
  if (!key || !key.startsWith(PREFIX)) return null;
  const payload = uni.getStorageSync(key);
  uni.removeStorageSync(key);
  return payload || null;
};
