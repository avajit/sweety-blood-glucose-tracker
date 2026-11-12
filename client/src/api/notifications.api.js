import { httpClient } from './httpClient.js';

export async function getVapidPublicKey() {
  const { data } = await httpClient.get('/notifications/vapid-public-key');
  return data.data.publicKey;
}

export async function subscribePush(subscription) {
  const { data } = await httpClient.post('/notifications/subscribe', { subscription });
  return data.data;
}

export async function unsubscribePush(endpoint) {
  const { data } = await httpClient.post('/notifications/unsubscribe', { endpoint });
  return data.data;
}

export async function sendTestPush() {
  const { data } = await httpClient.post('/notifications/test', {});
  return data.data;
}

