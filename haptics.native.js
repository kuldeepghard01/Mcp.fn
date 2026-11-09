// MCP v3 FINAL (APK build)
import * as Haptics from 'expo-haptics';

const safe = (p) => { if (p && p.catch) p.catch(() => {}); };

export const tap = () => {
  try { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); } catch (e) {}
};
export const success = () => {
  try { safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)); } catch (e) {}
};
export const warn = () => {
  try { safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)); } catch (e) {}
};
