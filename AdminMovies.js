// MCP v3 FINAL (APK build)
import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, notify, confirmBox, Btn, Field, Chips } from './ui';
import { rpc, uploadBanner } from './api';
import { box, head } from './adminCommon';
import { CATEGORIES, DEFAULT_QUESTIONS, TMDB_KEY, isLocked } from './constants';

export default function AdminMovies({ movies, onChanged }) {
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bollywood');
  const [release, setRelease] = useState('');
  const [trailer, setTrailer] = useState('');
  const [banner, setBanner] = useState('');
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS.slice());
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEditId(null); setTitle(''); setCategory('Bollywood'); setRelease(''); setTrailer(''); setBanner('');
    setQuestions(DEFAULT_QUESTIONS.slice());
  };

  const autoFill = async () => {
    if (!title.trim()) { notify('Type the movie name first.'); return; }
    setBusy(true);
    try {
      const res = await fetch('https://api.themoviedb.org/3/search/movie?api_key=' + TMDB_KEY + '&query=' + encodeURIComponent(title.trim()));
      const d = await res.json();
      if (d && d.results && d.results.length > 0) {
        const m = d.results[0];
        if (m.title) setTitle(m.title);
        if (m.release_date) setRelease(m.release_date);
        if (m.poster_path) setBanner('https://image.tmdb.org/t/p/w780' + (m.backdrop_path || m.poster_path));
        try {
          const vr = await fetch('https://api.themoviedb.org/3/movie/' + m.id + '/videos?api_key=' + TMDB_KEY);
          const vd = await vr.json();
          const t = ((vd && vd.results) || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer');
          if (t) setTrailer('https://www.youtube.com/watch?v=' + t.key);
        } catch (e) {}
        notify('Details found. Please check them, then save.');
      } else {
        notify('Movie not found. Please fill the details yourself.');
      }
    } catch (e) {
      notify('Auto-fill failed. Check your internet connection.');
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
    const ok = await confirmBox('Delete "' + m.title + '"? All entries for it will be removed.');
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
            {!m.settled_at ? <Btn title="🗑 Delete" small color="#b71c1c" onPress={() => del(m)} /> : null}
          </View>
        </View>
      ))}
    </View>
  );
}
