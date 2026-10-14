// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { C, Btn, notify } from './ui';
import { rpc } from './api';
import AdBanner from './AdBanner';
import { fmtCr, fmtNum, isLocked, timeLeft, lockText } from './constants';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500';

const rankLabel = (t) => (t.from_rank === t.to_rank ? '#' + t.from_rank : '#' + t.from_rank + ' - #' + t.to_rank);

export default function MovieScreen({ visible, movie, entries, maxEntries, tiers, count, initialTab, onClose, onJoin, onTrailer }) {
  const [tab, setTab] = useState('prizes');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const movieId = movie ? movie.id : null;

  useEffect(() => {
    if (visible) setTab(initialTab || 'prizes');
  }, [visible, movieId, initialTab]);

  useEffect(() => {
    if (!visible || !movieId || tab !== 'leaderboard') return;
    let alive = true;
    setLoading(true);
    rpc('mcp_leaderboard', { p_movie: movieId, p_limit: 100 })
      .then((r) => { if (alive) setRows(r || []); })
      .catch((e) => { if (alive) notify(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [visible, movieId, tab]);

  if (!movie) return null;
  const locked = isLocked(movie);
  const settled = !!movie.settled_at;
  const qs = movie.about_questions || [];
  const mine = entries || [];
  const maxE = maxEntries || 4;

  const tabBtn = (key, label) => (
    <TouchableOpacity onPress={() => setTab(key)} style={{ marginRight: 24, paddingBottom: 8, borderBottomWidth: 3, borderBottomColor: tab === key ? C.red : 'transparent' }}>
      <Text style={{ color: tab === key ? '#fff' : '#888', fontWeight: 'bold', fontSize: 13 }}>{label}</Text>
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
            <Text style={{ color: '#ff8a50', fontSize: 11, fontWeight: 'bold' }}>{settled ? 'Results out' : (locked ? 'Closed' : timeLeft(movie))}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 30 }}>
          <View style={{ marginHorizontal: 12, borderRadius: 10, overflow: 'hidden' }}>
            <Image source={{ uri: movie.banner_url || PLACEHOLDER }} style={{ width: '100%', height: 180, backgroundColor: '#222' }} resizeMode="cover" />
            {settled ? (
              <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: C.green }}>
                <Text style={{ color: C.sub, fontSize: 9, fontWeight: 'bold' }}>DAY 1 COLLECTION</Text>
                <Text style={{ color: C.green, fontSize: 18, fontWeight: 'bold' }}>{fmtCr(movie.actual_collection)}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              onPress={() => onTrailer(movie)}
              style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(229,9,20,0.95)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>▶ Watch trailer</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#222' }}>
            {tabBtn('prizes', 'PRIZES')}
            {tabBtn('leaderboard', 'LEADERBOARD')}
          </View>

          {tab === 'prizes' ? (
            <View style={{ padding: 16 }}>
              <Text style={{ color: C.sub, fontSize: 12 }}>{'👥 ' + (count || 0) + ' players joined'}</Text>
              <Text style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{'Entries close: ' + lockText(movie)}</Text>

              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 16, marginBottom: 6 }}>How to play</Text>
              <Text style={{ color: '#bbb', fontSize: 12, lineHeight: 18 }}>
                {'1. Predict the Day 1 collection (up to 100 points).\n2. Answer the questions about the movie (10 points each).\n3. Join free by watching a short ad.\nHighest total score wins. Ties are broken by the closest collection, then the earliest entry.'}
              </Text>

              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 16, marginBottom: 6 }}>About the movie questions</Text>
              {qs.map((q, i) => (
                <Text key={i} style={{ color: '#bbb', fontSize: 12, marginBottom: 2 }}>{'• ' + q + '?  Yes / No'}</Text>
              ))}

              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginTop: 16, marginBottom: 8 }}>Prizes (coins)</Text>
              <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 }}>
                <Text style={{ color: '#888', fontSize: 12, flex: 1 }}>Rank</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>Coins</Text>
              </View>
              {(tiers || []).map((t) => (
                <View key={t.id} style={{ flexDirection: 'row', backgroundColor: '#1c1a1a', padding: 12, borderRadius: 10, marginBottom: 6 }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', flex: 1 }}>{rankLabel(t)}</Text>
                  <Text style={{ color: C.gold, fontWeight: 'bold' }}>{'🪙 ' + fmtNum(t.coins)}</Text>
                </View>
              ))}
              <Text style={{ color: '#666', fontSize: 10, marginTop: 8 }}>Coins have no cash value. Use them in the Coins tab to request movie tickets.</Text>
              <AdBanner />
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              {settled && movie.about_answers ? (
                <View style={{ backgroundColor: '#122e1e', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: C.green }}>
                  <Text style={{ color: C.green, fontWeight: 'bold', fontSize: 13 }}>{'Official Day 1: ' + fmtCr(movie.actual_collection)}</Text>
                  {qs.map((q, i) => (
                    <Text key={i} style={{ color: '#ddd', fontSize: 11, marginTop: 2 }}>{q + ': ' + (movie.about_answers[i] ? 'Yes' : 'No')}</Text>
                  ))}
                </View>
              ) : null}
              {mine.map((en, k) => (
                <View key={en.id} style={{ backgroundColor: '#1a2a3a', padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: C.blue }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{'Your entry ' + (k + 1) + ': ' + fmtCr(en.prediction)}</Text>
                  <Text style={{ color: '#ccc', fontSize: 11, marginTop: 3 }}>
                    {(en.answers || []).map((a, i) => (qs[i] || 'Q' + (i + 1)) + ': ' + (a ? 'Yes' : 'No')).join('  |  ')}
                  </Text>
                  {en.final_rank ? (
                    <Text style={{ color: C.gold, fontSize: 12, marginTop: 6, fontWeight: 'bold' }}>
                      {'Rank #' + en.final_rank + '  |  Score ' + en.score + '  |  Won 🪙 ' + fmtNum(en.prize)}
                    </Text>
                  ) : null}
                  {!locked ? <Btn title="✏️ Edit" small color="#333" onPress={() => onJoin(movie, en)} style={{ marginTop: 8, alignSelf: 'flex-start' }} /> : null}
                </View>
              ))}
              {!locked ? (
                <Text style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>Predictions of other players stay hidden until entries close.</Text>
              ) : null}
              <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 6 }}>
                <Text style={{ color: '#888', fontSize: 12, width: 44 }}>Rank</Text>
                <Text style={{ color: '#888', fontSize: 12, flex: 1 }}>Player</Text>
                <Text style={{ color: '#888', fontSize: 12 }}>{settled ? 'Score / Coins' : 'Prediction'}</Text>
              </View>
              {loading ? <ActivityIndicator color={C.red} style={{ marginVertical: 16 }} /> : null}
              {!loading && rows.length === 0 ? (
                <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 20 }}>No entries to show yet.</Text>
              ) : null}
              {rows.map((r, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: r.is_me ? '#1a2a3a' : '#1c1a1a', padding: 12, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: r.is_me ? C.blue : 'transparent' }}>
                  <Text style={{ color: C.gold, fontWeight: 'bold', width: 44 }}>{settled ? '#' + r.pos : '•'}</Text>
                  <Text numberOfLines={1} style={{ color: '#fff', flex: 1, fontSize: 13 }}>{r.player + (r.entry_no > 1 ? ' (' + r.entry_no + ')' : '') + (r.is_me ? ' (You)' : '')}</Text>
                  {settled ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#fff', fontSize: 12 }}>{r.score}</Text>
                      <Text style={{ color: Number(r.prize) > 0 ? C.green : '#666', fontSize: 11 }}>{'🪙 ' + fmtNum(r.prize)}</Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#ddd', fontSize: 12 }}>{fmtCr(r.prediction)}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={{ padding: 14, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: '#222' }}>
          {locked ? (
            <Btn title={settled ? 'Contest finished' : 'Entries closed'} disabled onPress={() => {}} />
          ) : mine.length >= maxE ? (
            <Btn title={'All ' + maxE + ' entries used'} disabled onPress={() => {}} />
          ) : (
            <Btn title={mine.length > 0 ? 'Add another entry with Ad  ▶' : 'Join free with Ad  ▶'} color={C.red} onPress={() => onJoin(movie, null)} style={{ borderRadius: 24, paddingVertical: 14 }} />
          )}
        </View>
      </View>
    </Modal>
  );
}
