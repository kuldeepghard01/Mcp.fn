// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { C, notify, confirmBox, Btn, Field, Sheet } from './ui';
import { rpc } from './api';
import { fmtNum } from './constants';

export default function RedeemModal({ visible, reward, coins, onClose, onDone }) {
  const [movie, setMovie] = useState('');
  const [place, setPlace] = useState('');
  const [contact, setContact] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) { setMovie(''); setPlace(''); setContact(''); setNote(''); setBusy(false); }
  }, [visible, reward && reward.id]);

  if (!reward) return null;

  const submit = async () => {
    if (movie.trim().length < 2) { notify('Enter the movie you want to watch.'); return; }
    if (place.trim().length < 2) { notify('Enter your city and country.'); return; }
    if (contact.trim().length < 5) { notify('Enter a contact email or phone number.'); return; }
    const ok = await confirmBox('Use ' + fmtNum(reward.coins_cost) + ' coins to request: ' + reward.title + '?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_redeem', { p_reward: reward.id, p_movie_title: movie, p_location: place, p_contact: contact, p_note: note });
      notify('Request sent! Our team will review it and send your ticket details. Track it in the Coins tab.');
      onDone();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="Redeem coins" onClose={onClose}>
      <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>{reward.title}</Text>
      <Text style={{ color: C.sub, fontSize: 12, marginVertical: 4 }}>{reward.description}</Text>
      <Text style={{ color: C.gold, fontWeight: 'bold', marginBottom: 10 }}>{'Cost: 🪙 ' + fmtNum(reward.coins_cost) + '   |   You have: 🪙 ' + fmtNum(coins)}</Text>
      <Field label="Movie you want to watch" value={movie} onChangeText={setMovie} autoCapitalize="words" maxLength={100} />
      <Field label="City and country" value={place} onChangeText={setPlace} autoCapitalize="words" maxLength={100} />
      <Field label="Contact email or phone" value={contact} onChangeText={setContact} maxLength={100} />
      <Field label="Note (optional, e.g. preferred show time)" value={note} onChangeText={setNote} autoCapitalize="sentences" maxLength={300} />
      <Btn title={busy ? 'Please wait...' : 'Request ticket'} onPress={submit} disabled={busy} />
      <Text style={{ color: '#777', fontSize: 10, marginTop: 8 }}>
        Coins are held when you send the request. If it is refused, they are returned. Rewards depend on availability.
      </Text>
    </Sheet>
  );
}
