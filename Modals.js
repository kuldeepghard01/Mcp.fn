// MCP v3 FINAL (APK build)
import React from 'react';
import { View, Text } from 'react-native';
import { C, Sheet, Btn, dateText } from './ui';
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

export function HowToModal({ visible, onClose }) {
  const steps = [
    ['1', 'Pick a movie', 'Open any upcoming movie in the Contests tab.'],
    ['2', 'Make your prediction', 'Enter the Day 1 collection and answer the Yes / No questions about the movie.'],
    ['3', 'Join free', 'Watch a short ad to lock in your entry. You can change it until entries close.'],
    ['4', 'Win coins', 'When the official result is out, the closest predictions win coins. A better rank gives more coins.'],
    ['5', 'Redeem', 'Collect coins from contests, daily rewards and ads, then redeem movie tickets in the Coins tab.'],
  ];
  return (
    <Sheet visible={visible} title="🎬 How to play" onClose={onClose}>
      {steps.map((s) => (
        <View key={s[0]} style={{ flexDirection: 'row', marginBottom: 12 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{s[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{s[1]}</Text>
            <Text style={{ color: '#bbb', fontSize: 12, marginTop: 2 }}>{s[2]}</Text>
          </View>
        </View>
      ))}
      <Text style={{ color: '#777', fontSize: 10, marginBottom: 10 }}>MCP Fantasy is free to play. Coins have no cash value.</Text>
      <Btn title="Got it, let's play" onPress={onClose} />
    </Sheet>
  );
}
