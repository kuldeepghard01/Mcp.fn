// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { C, notify, Btn, Field, Chips } from './ui';
import { rpc } from './api';
import { showRewardedAd } from './ads';
import { fmtCr, fmtNum, toCr, timeLeft, lockText, MAX_COLLECTION_CR } from './constants';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500';

// Full screen "predict" page: collection prediction + movie Yes/No questions + Join with Ad.
export default function JoinModal({ visible, movie, entry, topPrize, used = 0, max = 4, onClose, onDone, onTrailer }) {
  const [val, setVal] = useState('');
  const [unit, setUnit] = useState('cr');
  const [ans, setAns] = useState([]);
  const [busy, setBusy] = useState(false);
  const qs = movie ? movie.about_questions || [] : [];

  useEffect(() => {
    if (!visible || !movie) return;
    setBusy(false);
    if (entry) {
      const p = Number(entry.prediction);
      if (p < 1) { setUnit('lakh'); setVal(String(Number((p * 100).toFixed(2)))); }
      else { setUnit('cr'); setVal(String(p)); }
      setAns((entry.answers || []).map((x) => !!x));
    } else {
      setVal('');
      setUnit('cr');
      setAns((movie.about_questions || []).map(() => null));
    }
  }, [visible, movie && movie.id, entry && entry.id]);

  if (!movie) return null;
  const cr = toCr(val, unit);
  const isEdit = !!entry;

  const setAnswer = (i, v) => {
    const next = ans.slice();
    next[i] = v;
    setAns(next);
  };

  const submit = async () => {
    if (isNaN(cr) || cr <= 0 || cr > MAX_COLLECTION_CR) { notify('Enter a valid Day 1 collection.'); return; }
    if (ans.length !== qs.length || ans.some((a) => a !== true && a !== false)) { notify('Please answer all the movie questions.'); return; }
    setBusy(true);
    try {
      if (isEdit) {
        await rpc('mcp_edit_entry', { p_entry: entry.id, p_prediction: cr, p_answers: ans });
        notify('Your entry was updated.');
      } else {
        const res = await showRewardedAd('Join ' + movie.title);
        if (res === 'dismissed') {
          notify('Please watch the full ad to join.');
          setBusy(false);
          return;
        }
        await rpc('mcp_join_contest', { p_movie: movie.id, p_prediction: cr, p_answers: ans });
        if (res === 'earned') rpc('mcp_log_ad', { p_placement: 'join' }).catch(() => {});
        notify('Success! You have joined. Find your entry, prizes and leaderboard in My Contests.');
      }
      onDone();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const pill = (label, active, color, onPress) => (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 18, backgroundColor: active ? color : '#2a2a2a', marginLeft: 8 }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 38, paddingHorizontal: 12, paddingBottom: 10 }}>
          <TouchableOpacity onPress={onClose} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>
          <Text numberOfLines={1} style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1, marginHorizontal: 10 }}>{movie.title}</Text>
          <View style={{ backgroundColor: '#3a1a10', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 }}>
            <Text style={{ color: '#ff8a50', fontSize: 11, fontWeight: 'bold' }}>{timeLeft(movie)}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
          <View style={{ borderRadius: 10, overflow: 'hidden' }}>
            <Image source={{ uri: movie.banner_url || PLACEHOLDER }} style={{ width: '100%', height: 170, backgroundColor: '#222' }} resizeMode="cover" />
            <TouchableOpacity
              onPress={() => onTrailer(movie)}
              style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(229,9,20,0.95)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>▶ Watch trailer</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#888', fontSize: 11, marginTop: 8 }}>{movie.category + '  |  Release: ' + movie.release_date}</Text>
          <Text style={{ color: '#888', fontSize: 11 }}>{'Entries close: ' + lockText(movie)}</Text>
          <Text style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>{isEdit ? 'Editing your entry' : 'Entry ' + (used + 1) + ' of ' + max}</Text>
          {topPrize ? <Text style={{ color: C.gold, fontSize: 12, fontWeight: 'bold', marginTop: 6 }}>{'🏆 Win up to 🪙 ' + fmtNum(topPrize) + ' coins'}</Text> : null}

          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 18, marginBottom: 6 }}>About the movie</Text>
          {qs.map((q, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#262626' }}>
              <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{q}</Text>
              {pill('Yes', ans[i] === true, '#1b5e20', () => setAnswer(i, true))}
              {pill('No', ans[i] === false, '#b71c1c', () => setAnswer(i, false))}
            </View>
          ))}

          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6 }}>One day collection</Text>
          <Chips options={[{ key: 'cr', label: 'Crore' }, { key: 'lakh', label: 'Lakh' }]} value={unit} onChange={setUnit} />
          <Field value={val} onChangeText={setVal} keyboardType="decimal-pad" placeholder={unit === 'cr' ? 'e.g. 85.68' : 'e.g. 50'} maxLength={10} />
          {!isNaN(cr) && cr > 0 ? <Text style={{ color: C.gold, fontSize: 12 }}>{'Your prediction: ' + fmtCr(cr)}</Text> : null}
          <Btn title={busy ? 'Please wait...' : (isEdit ? 'Save changes' : 'Join with Ad  ▶')} onPress={submit} disabled={busy} color={C.red} style={{ borderRadius: 24, paddingVertical: 14, marginTop: 18 }} />
          <Text style={{ color: '#777', fontSize: 10, marginTop: 12 }}>
            Free to play. You can change your entry until entries close. Prizes and the leaderboard are in My Contests.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}
