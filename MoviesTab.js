// MCP v3 FINAL (APK build)
import React, { useEffect, useRef, useState } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, Linking, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { styles } from './styles';
import { C, notify } from './ui';
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

// One card in the swipe row of finished movies
function ResultCard({ m, onOpen, onTrailer }) {
  return (
    <TouchableOpacity style={[styles.card, { marginBottom: 0 }]} activeOpacity={0.9} onPress={() => onOpen(m)}>
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: m.banner_url || PLACEHOLDER }} style={{ width: '100%', height: 150, backgroundColor: '#222' }} resizeMode="cover" />
        <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: C.green }}>
          <Text style={{ color: C.sub, fontSize: 9, fontWeight: 'bold' }}>DAY 1 COLLECTION</Text>
          <Text style={{ color: C.green, fontSize: 18, fontWeight: 'bold' }}>{fmtCr(m.actual_collection)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onTrailer(m)}
          style={{ position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(229,9,20,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>▶ Trailer</Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 12 }}>
        <Text numberOfLines={1} style={styles.movieTitle}>{m.title}</Text>
        <Text style={{ color: '#888', fontSize: 11, marginTop: 3 }}>{m.category + '  |  Release: ' + m.release_date}</Text>
        {m.result_source_name ? <Text style={{ color: '#6f8fbf', fontSize: 10, marginTop: 2 }}>{'Source: ' + m.result_source_name}</Text> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 11 }}>🏆 Results are out</Text>
          <View style={styles.closedBtn}><Text style={{ color: C.sub, fontSize: 11, fontWeight: 'bold' }}>View ➔</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Swipe row (side scroll) of the latest results, with dots below
function ResultsRow({ list, onOpen, onTrailer }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  if (!list || list.length === 0) return null;
  const cardW = Math.min(width - 56, 420);
  const gap = 10;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>🏆 Results declared</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardW + gap}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / (cardW + gap));
          if (i !== page) setPage(i);
        }}
      >
        {list.map((m) => (
          <View key={m.id} style={{ width: cardW, marginRight: gap }}>
            <ResultCard m={m} onOpen={onOpen} onTrailer={onTrailer} />
          </View>
        ))}
      </ScrollView>
      {list.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
          {list.map((m, i) => (
            <View key={m.id} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? C.red : '#444', marginHorizontal: 3 }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function MoviesTab({ movies, counts, joined, maxEntries, loading, sponsors, category, onCategory, refreshing, onRefresh, onOpen, onTrailer }) {
  const filtered = category === 'ALL' ? movies : movies.filter((m) => (m.category || '').toLowerCase() === category.toLowerCase());
  // 1) latest declared results first, at most 10
  const results = filtered
    .filter((m) => !!m.settled_at)
    .sort((a, b) => new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime())
    .slice(0, 10);
  // 2) upcoming movies, soonest release first
  const upcoming = filtered
    .filter((m) => !m.settled_at && !isLocked(m))
    .sort((a, b) => (String(a.release_date) < String(b.release_date) ? -1 : 1));
  // 3) entries closed, result not declared yet
  const waiting = filtered
    .filter((m) => !m.settled_at && isLocked(m))
    .sort((a, b) => (String(a.release_date) < String(b.release_date) ? 1 : -1));

  const items = [];
  upcoming.forEach((m, i) => {
    items.push({ key: m.id, movie: m });
    if ((i + 1) % 3 === 0) items.push({ key: 'ad' + i, ad: true });
  });

  const renderCard = (m) => {
    const locked = isLocked(m);
    const n = counts[m.id] || 0;
    return (
      <TouchableOpacity key={m.id} style={styles.card} activeOpacity={0.9} onPress={() => onOpen(m)}>
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: m.banner_url || PLACEHOLDER }} style={styles.bannerImage} resizeMode="cover" />
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
              <Text style={{ color: locked ? C.sub : C.green, fontWeight: 'bold', fontSize: 11 }}>
                {locked ? '🔒 Entries closed' : '⏳ ' + timeLeft(m)}
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
  };

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
      <ResultsRow list={results} onOpen={onOpen} onTrailer={onTrailer} />
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>🎬 Upcoming movies</Text>
    </View>
  );

  const footer = waiting.length > 0 ? (
    <View style={{ marginTop: 6 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>⏳ Waiting for results</Text>
      {waiting.map((m) => renderCard(m))}
    </View>
  ) : null;

  return (
    <View style={styles.listSection}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.key}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={loading && movies.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <ActivityIndicator color={C.red} size="large" />
            <Text style={{ color: C.sub, fontSize: 12, marginTop: 10 }}>Loading contests...</Text>
          </View>
        ) : (
          <Text style={{ color: C.sub, textAlign: 'center', marginVertical: 24 }}>No upcoming contests right now. Check back soon.</Text>
        )}
        renderItem={({ item }) => (item.ad ? <AdBanner /> : renderCard(item.movie))}
      />
    </View>
  );
}
