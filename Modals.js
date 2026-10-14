// MCP v3 FINAL (APK build)
import React from 'react';
import { View, Text } from 'react-native';
import { C, Sheet, dateText } from './ui';
import { TERMS } from './constants';

export function NotificationsModal({ visible, notifs, onClose }) {
  return (
    <Sheet visible={visible} title="🔔 Notifications" onClose={onClose}>
      {(!notifs || notifs.length === 0) ? (
        <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 20 }}>No notifications yet.</Text>
      ) : null}
      {(notifs || []).map((n) => (
        <View key={n.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#282828' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{n.title}</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginTop: 2 }}>{n.message}</Text>
          <Text style={{ color: '#666', fontSize: 10, marginTop: 4 }}>{dateText(n.created_at)}</Text>
        </View>
      ))}
    </Sheet>
  );
}

export function TermsModal({ visible, onClose }) {
  return (
    <Sheet visible={visible} title="📜 Terms & Privacy" onClose={onClose}>
      {TERMS.map((s) => (
        <View key={s.h} style={{ marginBottom: 12 }}>
          <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 13 }}>{s.h}</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginTop: 3, lineHeight: 18 }}>{s.t}</Text>
        </View>
      ))}
    </Sheet>
  );
}
