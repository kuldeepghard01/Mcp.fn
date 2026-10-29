// MCP v3 FINAL (APK build)
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, notify, confirmBox, Btn, Field, Chips } from './ui';
import { rpc, uploadBanner } from './api';
import { box, head } from './adminCommon';
import { CATEGORIES, DEFAULT_QUESTIONS, TMDB_KEY, isLocked } from './constants';

const TMDB_HOSTS = ['api.themoviedb.org', 'api.tmdb.org'];

// Backup way: ask TMDB directly from the phone (tries two addresses).
const tmdbGet = async (path) => {
  let lastErr = null;
  for (const h of TMDB_HOSTS) {
    try {
      const res = await fetch('https://' + h + '/3' + path + (path.indexOf('?') >= 0 ? '&' : '?') + 'api_key=' + TMDB_KEY);
      const d = await res.json();
      if (res.ok) return d;
      lastErr = new Error(d && d.status_message ? d.status_message : 'TMDB error ' + res.status);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Cannot reach TMDB');
};

const directSearch = async (q) => {
  const d = await tmdbGet('/search/movie?include_adult=false&query=' + encodeURIComponent(q));
  return (d.results || []).slice(0, 6).map((x) => ({
    id: x.id, title: x.title, release_date: x.release_date, poster: x.poster_path,
    backdrop: x.backdrop_path, overview: String(x.overview || '').slice(0, 160),
  }));
};

const directDetails = async (id) => {
  const d = await tmdbGet('/movie/' + id + '?append_to_response=videos');
  const vids = (d.videos && d.videos.results) || [];
  const t = vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer');
  return {
    title: d.title, release_date: d.release_date, poster: d.poster_path, backdrop: d.backdrop_path,
    genres: (d.genres || []).map((g) => g.name).join(', '), trailer: t ? t.key : null,
  };
};

export default function AdminMovies({ movies, onChanged }) {
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bollywood');
  const [release, setRelease] = useState('');
  const [trailer, setTrailer] = useState('');
  const [banner, setBanner] = useState('');
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS.slice());
  const [busy, setBusy] = useState(false);
  const [cands, setCands] = useState([]);

  const reset = () => {
    setEditId(null); setTitle(''); setCategory('Bollywood'); setRelease(''); setTrailer(''); setBanner('');
    setQuestions(DEFAULT_QUESTIONS.slice());
  };

  const autoFill = async () => {
    if (!title.trim()) { notify('Type the movie name first.'); return; }
    setBusy(true);
    setCands([]);
    try {
      let list = null;
      try { list = await rpc('mcp_admin_tmdb_search', { p_query: title.trim() }); } catch (e) { list = null; }
      if (!list) list = await directSearch(title.trim());
      if (!list || list.length === 0) notify('No movie found with this name. Try the English name, or fill the details yourself.');
      else setCands(list);
    } catch (e) {
      notify('Auto-fill failed: ' + e.message + ' You can fill the details yourself.');
    }
    setBusy(false);
  };

  const pickCand = async (c) => {
    setBusy(true);
    try {
      let d = null;
      try { d = await rpc('mcp_admin_tmdb_details', { p_id: c.id }); } catch (e) { d = null; }
      if (!d) d = await directDetails(c.id);
      setTitle(d.title || c.title);
      if (d.release_date) setRelease(d.release_date);
      const img = d.backdrop || d.poster;
      if (img) setBanner('https://image.tmdb.org/t/p/w780' + img);
      setTrailer(d.trailer ? 'https://www.youtube.com/watch?v=' + d.trailer : '');
      setCands([]);
      notify('Details added.' + (d.genres ? ' Genres: ' + d.genres + '.' : '') + ' Please check the release date for your country, then save.');
    } catch (e) {
      notify('Could not load the details: ' + e.message);
    }
    setBusy(false);
  };

  const pickBanner = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.6 });
      if (r.canceled || !r.assets || r.assets.length === 0) return;
      setBusy(true);
      const url = await uploadBanner(r.assets[0].uri);
      setBanner(url);
      notify('Banner uploaded.');
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const setQ = (i, v) => {
    const next = questions.slice();
    next[i] = v;
    setQuestions(next);
  };

  const save = async () => {
    if (!title.trim()) { notify('Enter the movie name.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(release.trim())) { notify('Use the date format YYYY-MM-DD (for example 2026-10-10).'); return; }
    const qs = questions.map((q) => q.trim()).filter((q) => q.length > 0);
    if (qs.length < 1) { notify('Add at least one movie question.'); return; }
    setBusy(true);
    try {
      await rpc('mcp_admin_save_movie', {
        p_id: editId, p_title: title, p_category: category, p_release: release.trim(),
        p_banner: banner.trim() || null, p_trailer: trailer.trim() || null, p_questions: qs,
      });
      notify(editId ? 'Movie updated.' : 'Movie published.');
      reset();
      onChanged();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const edit = (m) => {
    setEditId(m.id); setTitle(m.title); setCategory(m.category); setRelease(m.release_date);
    setTrailer(m.trailer_url || ''); setBanner(m.banner_url || '');
    setQuestions((m.about_questions || DEFAULT_QUESTIONS).slice());
  };

  const del = async (m) => {
    const ok = await confirmBox(m.settled_at
      ? 'Delete "' + m.title + '" for good? Players keep the coins they already won, but all entries and the leaderboard for this movie will be removed. This cannot be undone.'
      : 'Delete "' + m.title + '"? All entries for it will be removed.');
    if (!ok) return;
    try {
      await rpc('mcp_admin_delete_movie', { p_id: m.id });
      notify('Movie deleted.');
      onChanged();
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <View>
      <View style={box}>
        <Text style={head}>{editId ? '✏️ Edit movie' : '➕ New movie'}</Text>
        <Field label="Movie name" value={title} onChangeText={setTitle} autoCapitalize="words" />
        <Btn title="🔍 Auto-fill (name, date, poster, trailer)" small color={C.blue} onPress={autoFill} disabled={busy} style={{ marginBottom: 10 }} />
        {cands.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>Tap the right movie:</Text>
            {cands.map((c) => (
              <TouchableOpacity key={String(c.id)} onPress={() => pickCand(c)} style={{ backgroundColor: C.card2, padding: 10, borderRadius: 8, marginBottom: 6 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>{c.title + (c.release_date ? ' (' + String(c.release_date).slice(0, 4) + ')' : '')}</Text>
                <Text numberOfLines={2} style={{ color: C.sub, fontSize: 11 }}>{c.overview || ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <Chips options={CATEGORIES.map((c) => ({ key: c, label: c }))} value={category} onChange={setCategory} />
        <Field label="Release date (YYYY-MM-DD)" value={release} onChangeText={setRelease} placeholder="2026-10-10" maxLength={10} />
        <Field label="Trailer link (YouTube)" value={trailer} onChangeText={setTrailer} />
        <Field label="Banner link (or pick from gallery below)" value={banner} onChangeText={setBanner} />
        {banner ? <Image source={{ uri: banner }} style={{ width: '100%', height: 140, borderRadius: 8, marginBottom: 8, backgroundColor: '#222' }} resizeMode="cover" /> : null}
        <Btn title="🖼 Pick banner from gallery" small color="#333" onPress={pickBanner} disabled={busy} style={{ marginBottom: 10 }} />

        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13, marginBottom: 6 }}>About the movie questions (Yes / No)</Text>
        {questions.map((q, i) => (
          <Field key={i} value={q} onChangeText={(v) => setQ(i, v)} autoCapitalize="sentences" maxLength={60} placeholder={'Question ' + (i + 1)} />
        ))}
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <Btn title="+ Add question" small color="#333" onPress={() => { if (questions.length < 8) setQuestions(questions.concat([''])); }} style={{ marginRight: 8 }} />
          <Btn title="- Remove last" small color="#333" onPress={() => { if (questions.length > 1) setQuestions(questions.slice(0, questions.length - 1)); }} />
        </View>
        <Text style={{ color: '#777', fontSize: 10, marginBottom: 8 }}>
          Entries close at 12:00 AM India time on the release date. Questions cannot be changed after players join.
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Btn title={busy ? 'Please wait...' : (editId ? 'Update' : 'Publish')} onPress={save} disabled={busy} style={{ flex: 1, marginRight: 6 }} />
          {editId ? <Btn title="Cancel" color="#333" onPress={reset} style={{ flex: 1 }} /> : null}
        </View>
      </View>
      <Text style={head}>🎬 All movies</Text>
      {movies.map((m) => (
        <View key={m.id} style={box}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>{m.title}</Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>{m.category + ' | ' + m.release_date + (m.settled_at ? ' | Results out' : (isLocked(m) ? ' | Closed' : ' | Open'))}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {!m.settled_at ? <Btn title="✏️ Edit" small color={C.blue} onPress={() => edit(m)} style={{ marginRight: 8 }} /> : null}
            <Btn title="🗑 Delete" small color="#b71c1c" onPress={() => del(m)} />
          </View>
        </View>
      ))}
    </View>
  );
}
