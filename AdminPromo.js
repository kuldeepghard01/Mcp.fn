// MCP v3 FINAL (APK build)
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { C, notify, Btn, Field, Chips } from './ui';
import { rpc } from './api';
import { box, head } from './adminCommon';

export default function AdminPromo({ movies, onChanged }) {
  const [id, setId] = useState(null);
  const [ticket, setTicket] = useState('');
  const [sName, setSName] = useState('');
  const [sLogo, setSLogo] = useState('');
  const [sUrl, setSUrl] = useState('');
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);

  const choose = async (mid) => {
    const m = movies.find((x) => x.id === mid);
    if (!m) return;
    setId(mid);
    setTicket(m.ticket_url || '');
    setSName(m.sponsor_name || '');
    setSLogo(m.sponsor_logo_url || '');
    setSUrl(m.sponsor_url || '');
    setStats(null);
    try { setStats(await rpc('mcp_admin_promo_stats', { p_movie: mid })); } catch (e) {}
  };

  const save = async () => {
    setBusy(true);
    try {
      await rpc('mcp_admin_set_movie_promo', { p_movie: id, p_ticket_url: ticket, p_sponsor_name: sName, p_sponsor_logo: sLogo, p_sponsor_url: sUrl });
      notify('Saved.');
      onChanged();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <View>
      <View style={box}>
        <Text style={head}>🎯 Sponsor and ticket link</Text>
        <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Choose a movie. Add a sponsor ("Presented by ...") and/or a ticket booking link. Leave a box empty to remove it. Players see a clear "Sponsored" tag and an affiliate note.
        </Text>
        <Chips options={movies.map((m) => ({ key: m.id, label: m.title }))} value={id} onChange={choose} />
      </View>
      {id ? (
        <View style={box}>
          <Field label="Ticket booking link (https://...)" value={ticket} onChangeText={setTicket} maxLength={300} />
          <Field label="Sponsor name" value={sName} onChangeText={setSName} autoCapitalize="words" maxLength={60} />
          <Field label="Sponsor logo link (https://..., square image)" value={sLogo} onChangeText={setSLogo} maxLength={300} />
          <Field label="Sponsor website link (https://...)" value={sUrl} onChangeText={setSUrl} maxLength={300} />
          <Btn title={busy ? 'Please wait...' : 'Save'} onPress={save} disabled={busy} />
          {stats ? (
            <Text style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>
              {'Ticket link taps: ' + (stats.ticket || 0) + '   |   Sponsor link taps: ' + (stats.sponsor || 0)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
