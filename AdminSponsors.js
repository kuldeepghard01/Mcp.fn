// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, notify, confirmBox, Btn, Field } from './ui';
import { rpc, select, uploadBanner } from './api';
import { box, head } from './adminCommon';

export default function AdminSponsors() {
  const [list, setList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setList((await select('mcp_sponsors', 'select=*&order=created_at.desc')) || []); } catch (e) { notify(e.message); }
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setEditId(null); setTitle(''); setImage(''); setLink(''); };

  const pick = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 5], quality: 0.7 });
      if (r.canceled || !r.assets || r.assets.length === 0) return;
      setBusy(true);
      setImage(await uploadBanner(r.assets[0].uri));
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const save = async (id, t, img, lnk, active) => {
    setBusy(true);
    try {
      await rpc('mcp_admin_save_sponsor', { p_id: id, p_title: t, p_image: img, p_link: lnk || null, p_active: active });
      reset();
      await load();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const remove = async (s) => {
    const ok = await confirmBox('Delete sponsor "' + s.title + '"?');
    if (!ok) return;
    try {
      await rpc('mcp_admin_delete_sponsor', { p_id: s.id });
      await load();
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <View>
      <View style={box}>
        <Text style={head}>{editId ? '✏️ Edit sponsor' : '➕ New sponsor banner'}</Text>
        <Field label="Brand / campaign name" value={title} onChangeText={setTitle} autoCapitalize="words" maxLength={60} />
        <Field label="Banner image link (wide image works best)" value={image} onChangeText={setImage} />
        {image ? <Image source={{ uri: image }} style={{ width: '100%', height: 80, borderRadius: 8, marginBottom: 8, backgroundColor: '#222' }} resizeMode="cover" /> : null}
        <Btn title="🖼 Upload image from gallery" small color="#333" onPress={pick} disabled={busy} style={{ marginBottom: 10 }} />
        <Field label="Link when tapped (https://...)" value={link} onChangeText={setLink} />
        <View style={{ flexDirection: 'row' }}>
          <Btn title={busy ? 'Please wait...' : 'Save'} onPress={() => save(editId, title, image, link, true)} disabled={busy} style={{ flex: 1, marginRight: 6 }} />
          {editId ? <Btn title="Cancel" color="#333" onPress={reset} style={{ flex: 1 }} /> : null}
        </View>
        <Text style={{ color: '#777', fontSize: 10, marginTop: 8 }}>The newest active sponsor is shown at the top of the Contests tab. Views and clicks are counted for your brand reports.</Text>
      </View>
      {list.map((s) => (
        <View key={s.id} style={box}>
          <Image source={{ uri: s.image_url }} style={{ width: '100%', height: 60, borderRadius: 6, backgroundColor: '#222' }} resizeMode="cover" />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 6 }}>{s.title + (s.active ? '' : '  (hidden)')}</Text>
          <Text style={{ color: C.sub, fontSize: 11 }}>{'Views ' + s.views + '  |  Clicks ' + s.clicks}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Btn title={s.active ? 'Hide' : 'Show'} small color="#333" onPress={() => save(s.id, s.title, s.image_url, s.link_url, !s.active)} style={{ marginRight: 8 }} />
            <Btn title="✏️ Edit" small color={C.blue} onPress={() => { setEditId(s.id); setTitle(s.title); setImage(s.image_url); setLink(s.link_url || ''); }} style={{ marginRight: 8 }} />
            <Btn title="🗑" small color="#b71c1c" onPress={() => remove(s)} />
          </View>
        </View>
      ))}
    </View>
  );
}
