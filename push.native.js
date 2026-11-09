// MCP v3 FINAL (APK build)
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { rpc } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const getProjectId = () => {
  const c = Constants || {};
  return (c.expoConfig && c.expoConfig.extra && c.expoConfig.extra.eas && c.expoConfig.extra.eas.projectId)
    || (c.easConfig && c.easConfig.projectId) || null;
};

// Asks for permission (only when askPermission is true), then saves this phone's push token on the server.
export const registerForPush = async (askPermission) => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MCP Fantasy',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#E50914',
      });
    }
    let perm = await Notifications.getPermissionsAsync();
    let status = perm.status;
    if (status !== 'granted' && askPermission) {
      const r = await Notifications.requestPermissionsAsync();
      status = r.status;
    }
    if (status !== 'granted') return status;
    const pid = getProjectId();
    const t = await Notifications.getExpoPushTokenAsync(pid ? { projectId: pid } : undefined);
    await rpc('mcp_save_push_token', { p_token: t.data, p_platform: Platform.OS });
    return 'granted';
  } catch (e) {
    return 'error';
  }
};

const handled = {};

// Calls cb(data) when the user taps a notification (also when the app was closed).
export const onNotificationTap = (cb) => {
  const run = (resp) => {
    try {
      const id = resp.notification.request.identifier;
      if (handled[id]) return;
      handled[id] = true;
      cb(resp.notification.request.content.data || {});
    } catch (e) {}
  };
  const sub = Notifications.addNotificationResponseReceivedListener(run);
  Notifications.getLastNotificationResponseAsync().then((resp) => { if (resp) run(resp); }).catch(() => {});
  return () => { try { sub.remove(); } catch (e) {} };
};
