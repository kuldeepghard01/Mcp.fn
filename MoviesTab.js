// MCP v3 FINAL (APK build)
import React, { useEffect, useRef } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, Linking } from 'react-native';
import { styles } from './styles';
import { C, Btn, notify } from './ui';
import { rpc } from './api';
import AdBanner from './AdBanner';
import { CATEGORIES, fmtCr, isLocked, timeLeft } from './constants';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500';

function SponsorCard({ sponsor }) {
  const seen = useRef('');
  useEffect(() => {
    if (sponsor && seen.current !== sponsor.id) {
      seen.current = sponsor.id;
      rpc('mcp_sponsor_view', { p_id: sponsor.id }).catch(() => {});
    }
  }, [sponsor && sponsor.id]);
  if (!sponsor) return null;
  const open = () => {
    rpc('mcp_sponsor_click', { p_id: sponsor.id }).catch(() => {});
    if (sponsor.link_url) Linking.openURL(sponsor.link_url).catch(() => notify('Could not open the link.'));
  };
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={open} style={{ marginBottom: 10 }}>
      <Image source={{ uri: sponsor.image_url }} style={{ width: '100%', height: 90, borderRadius: 8, backgroundColor: '#222' }} resizeMode="cover" />
      <Text style={{ color: '#666', fontSize: 9, marginTop: 2 }}>Sponsored</Text>
    </TouchableOpacity>
  );
}

export default function MoviesTab({ movies, counts, joined, maxEntries, sponsors, category, onCategory, refreshing, onRefresh, onOpen, onTrailer }) {
  const filtered = category === 'ALL' ? movies : movies.filter((m) => (m.category || '').toLowerCase() === category.toLowerCase());
  const items = [];
  filtered.forEach((m, i) => {
    items.push({ key: m.id, movie: m });
    if ((i + 1) % 3 === 0) items.push({ key: 'ad' + i, ad: true });
  });

  const header = (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
        {['ALL'].concat(CATEGORIES).map((cat) => (
          <TouchableOpacity key={cat} style={[styles.filterChip, category === cat && styles.activeFilterChip]} onPress={() => onCategory(cat)}>
            <Text style={{ color: '#fff', fontSize: 11 }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <SponsorCard sponsor={sponsors && sponsors.length > 0 ? sponsors[0] : null} />
    </View>
  );

  return (
    <View style={styles.listSection}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.key}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={{ color: C.sub, textAlign: 'center', marginTop: 40 }}>No contests right now. Check back soon.</Text>}
        renderItem={({ item }) => {
          if (item.ad) return <AdBanner />;
          const m = item.movie;
          const locked = isLocked(m);
          const settled = !!m.settled_at;
          const n = counts[m.id] || 0;
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onOpen(m)}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: m.banner_url || PLACEHOLDER }} style={styles.bannerImage} resizeMode="cover" />
                {settled ? (
                  <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: C.green }}>
                    <Text style={{ color: C.sub, fontSize: 9, fontWeight: 'bold' }}>DAY 1 COLLECTION</Text>
                    <Text style={{ color: C.green, fontSize: 18, fontWeight: 'bold' }}>{fmtCr(m.actual_collection)}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={() => onTrailer(m)}
                  style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(229,9,20,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>▶ Trailer</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.movieTitle}>{m.title}</Text>
                <Text style={{ color: '#888', fontSize: 11, marginTop: 3 }}>{m.category + '  |  Release: ' + m.release_date}</Text>
                <View style={styles.actionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: settled ? C.gold : (locked ? C.sub : C.green), fontWeight: 'bold', fontSize: 11 }}>
                      {settled ? '🏆 Results are out' : (locked ? '🔒 Entries closed' : '⏳ ' + timeLeft(m))}
                    </Text>
                    <Text style={{ color: '#777', fontSize: 10, marginTop: 2 }}>{'👥 ' + n + ' joined'}</Text>
                  </View>
                  {locked ? (
                    <View style={styles.closedBtn}><Text style={{ color: C.sub, fontSize: 11, fontWeight: 'bold' }}>View ➔</Text></View>
                  ) : (
                    <View style={styles.predictBtn}><Text style={styles.predictBtnText}>{joined && joined[m.id] ? '✅ ' + joined[m.id] + '/' + (maxEntries || 4) + ' entries ➔' : 'Join free ➔'}</Text></View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
