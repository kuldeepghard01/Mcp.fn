// MCP v3 FINAL (APK build)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { C, notify, confirmBox, Btn, Field, Chips } from './ui';
import { rpc } from './api';
import { box, head } from './adminCommon';
import { fmtCr, fmtNum, toCr, isLocked } from './constants';

export default function AdminResults({ movies, onChanged }) {
  const waiting = movies.filter((m) => isLocked(m) && !m.settled_at);
  const done = movies.filter((m) => !!m.settled_at);
  const [movieId, setMovieId] = useState(null);
  const [val, setVal] = useState('');
  const [unit, setUnit] = useState('cr');
  const [answers, setAnswers] = useState([]);
  const [winners, setWinners] = useState([]);
  const [busy, setBusy] = useState(false);

  const movie = movies.find((m) => m.id === movieId) || null;

  const choose = async (m) => {
    setMovieId(m.id);
    setVal('');
    setUnit('cr');
    setAnswers((m.about_questions || []).map(() => null));
    setWinners([]);
    if (m.settled_at) {
      try { setWinners((await rpc('mcp_admin_winners', { p_movie: m.id, p_limit: 30 })) || []); } catch (e) { notify(e.message); }
    }
  };

  const setAns = (i, v) => {
    const next = answers.slice();
    next[i] = v;
    setAnswers(next);
  };

  const declare = async () => {
    const cr = toCr(val, unit);
    if (isNaN(cr) || cr <= 0) { notify('Enter the official Day 1 collection.'); return; }
    if (answers.some((a) => a !== true && a !== false)) { notify('Set the correct answer (Yes or No) for every question.'); return; }
    const ok = await confirmBox('Declare results for ' + movie.title + ' with Day 1 = ' + fmtCr(cr) + '? Coins will be paid to winners now. This cannot be undone.');
    if (!ok) return;
    setBusy(true);
    try {
      const r = await rpc('mcp_admin_settle', { p_movie: movie.id, p_actual: cr, p_answers: answers });
      notify('Results declared. ' + r.entries + ' entries, ' + fmtNum(r.coins_paid) + ' coins paid.');
      onChanged();
      await choose({ ...movie, settled_at: 'now' });
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const yn = (label, active, color, onPress) => (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14, backgroundColor: active ? color : '#2a2a2a', marginLeft: 8 }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <Text style={head}>Waiting for results</Text>
      {waiting.length === 0 ? <Text style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>No closed movie is waiting for results.</Text> : null}
      <Chips options={waiting.map((m) => ({ key: m.id, label: m.title }))} value={movieId} onChange={(id) => choose(movies.find((m) => m.id === id))} />
      <Text style={[head, { marginTop: 6 }]}>Results declared</Text>
      <Chips options={done.map((m) => ({ key: m.id, label: m.title }))} value={movieId} onChange={(id) => choose(movies.find((m) => m.id === id))} />

      {movie && !movie.settled_at ? (
        <View style={box}>
          <Text style={head}>{'Declare results: ' + movie.title}</Text>
          <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>Official Day 1 collection</Text>
          <Chips options={[{ key: 'cr', label: 'Crore' }, { key: 'lakh', label: 'Lakh' }]} value={unit} onChange={setUnit} />
          <Field value={val} onChangeText={setVal} keyboardType="decimal-pad" maxLength={10} placeholder="e.g. 85.68" />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginVertical: 6 }}>Correct answers</Text>
          {(movie.about_questions || []).map((q, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: '#ddd', fontSize: 12, flex: 1 }}>{q}</Text>
              {yn('Yes', answers[i] === true, '#1b5e20', () => setAns(i, true))}
              {yn('No', answers[i] === false, '#b71c1c', () => setAns(i, false))}
            </View>
          ))}
          <Text style={{ color: '#777', fontSize: 10, marginVertical: 8 }}>
            Score = collection accuracy (0 to 100) + 10 points per correct answer. Prizes follow the prize table.
          </Text>
          <Btn title={busy ? 'Please wait...' : '🏆 Declare results'} onPress={declare} disabled={busy} />
        </View>
      ) : null}

      {movie && movie.settled_at ? (
        <View style={box}>
          <Text style={head}>{movie.title}</Text>
          <Text style={{ color: C.green, fontSize: 13, fontWeight: 'bold' }}>{'Official Day 1: ' + fmtCr(movie.actual_collection)}</Text>
          <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>Top 30 players</Text>
          {winners.map((w, i) => (
            <Text key={i} style={{ color: '#ddd', fontSize: 11, marginBottom: 3 }}>
              {'#' + w.pos + '  ' + w.player + ' (' + (w.email || '-') + ')  ' + fmtCr(w.prediction) + '  score ' + w.score + '  +' + fmtNum(w.prize)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
