// MCP v3 FINAL (APK build)
import React from 'react';
import { Text, View, FlatList } from 'react-native';
import { styles } from './styles';
import { C, Btn } from './ui';
import { fmtCr, fmtNum, isLocked } from './constants';

export default function MyContestsTab({ entries, movies, refreshing, onRefresh, onOpen, onEdit }) {
  return (
    <View style={styles.listSection}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>🎯 My contests</Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={{ color: C.sub, textAlign: 'center', marginTop: 40 }}>You have not joined any contest yet. Join one from the Contests tab.</Text>}
        renderItem={({ item }) => {
          const mv = movies.find((m) => m.id === item.movie_id);
          if (!mv) return null;
          const locked = isLocked(mv);
          const settled = !!mv.settled_at;
          const same = entries.filter((e) => e.movie_id === item.movie_id).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          const entryNo = same.findIndex((e) => e.id === item.id) + 1;
          return (
            <View style={[styles.card, { padding: 12 }]}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold' }}>{'🎬 ' + mv.title + (same.length > 1 ? '  (Entry ' + entryNo + ')' : '')}</Text>
              <Text style={{ color: '#ddd', fontSize: 13, marginTop: 4 }}>{'My prediction: ' + fmtCr(item.prediction)}</Text>
              <Text style={{ color: settled ? C.gold : C.sub, fontSize: 12, marginTop: 4 }}>
                {settled
                  ? 'Rank #' + item.final_rank + '  |  Score ' + item.score + '  |  Won 🪙 ' + fmtNum(item.prize)
                  : (locked ? '🔒 Entries closed. Waiting for the result.' : '🟢 Open. You can edit until entries close.')}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                {!locked ? <Btn title="✏️ Edit" small color={C.blue} style={{ marginRight: 8 }} onPress={() => onEdit(mv, item)} /> : null}
                <Btn title={settled ? '🏆 Leaderboard & prize' : '📊 Leaderboard'} small color="#333" onPress={() => onOpen(mv)} />
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
