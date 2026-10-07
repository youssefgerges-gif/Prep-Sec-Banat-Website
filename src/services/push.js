import { VAPID_PUBLIC_KEY, savePushSubscription, removePushSubscription, isMockMode } from './supabase';

// إشعارات الموبايل (Web Push) للخدام.
//
// - أندرويد (كروم) والكمبيوتر: بتشتغل من المتصفح على طول.
// - آيفون: لازم الأول "Add to Home Screen" من زرار المشاركة في Safari،
//   وبعدين تفتح الموقع من الأيقونة وتفعّل الإشعارات من هناك (iOS 16.4+).

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent || '');
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function getPushSupport() {
  if (isMockMode()) return { supported: false, reason: 'mock' };
  if (!VAPID_PUBLIC_KEY) return { supported: false, reason: 'not-configured' };
  if (isIos() && !isStandalone()) return { supported: false, reason: 'ios-home-screen' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return { supported: false, reason: 'browser' };
  }
  return { supported: true };
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
  });
}

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

export async function getCurrentSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('الإشعارات مقفولة للموقع ده — افتحها من إعدادات المتصفح وجرب تاني');
  }
  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }
  await savePushSubscription(sub);
  return sub;
}

export async function disablePush() {
  const sub = await getCurrentSubscription();
  if (!sub) return;
  await removePushSubscription(sub.endpoint);
  await sub.unsubscribe();
}
