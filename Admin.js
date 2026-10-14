// MCP v3 FINAL (APK build)
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chips } from './ui';
import AdminMovies from './AdminMovies';
import AdminResults from './AdminResults';
import AdminRequests from './AdminRequests';
import AdminSponsors from './AdminSponsors';
import AdminEarnings from './AdminEarnings';
import AdminSettings from './AdminSettings';
import { AdminOverview, AdminUsers, AdminNotify } from './AdminMisc';

export default function Admin({ movies, onChanged }) {
  const [sec, setSec] = useState('overview');
  return (
    <ScrollView style={{ flex: 1, padding: 10 }} keyboardShouldPersistTaps="handled">
      <Chips
        options={[
          { key: 'overview', label: '📈 Overview' },
          { key: 'movies', label: '🎬 Movies' },
          { key: 'results', label: '🏆 Results' },
          { key: 'requests', label: '🎟️ Requests' },
          { key: 'earnings', label: '💰 Earnings' },
          { key: 'users', label: '👥 Users' },
          { key: 'sponsors', label: '💼 Sponsors' },
          { key: 'notify', label: '📢 Notify' },
          { key: 'settings', label: '⚙️ Settings' },
        ]}
        value={sec}
        onChange={setSec}
      />
      {sec === 'overview' ? <AdminOverview /> : null}
      {sec === 'movies' ? <AdminMovies movies={movies} onChanged={onChanged} /> : null}
      {sec === 'results' ? <AdminResults movies={movies} onChanged={onChanged} /> : null}
      {sec === 'requests' ? <AdminRequests onChanged={onChanged} /> : null}
      {sec === 'users' ? <AdminUsers onChanged={onChanged} /> : null}
      {sec === 'sponsors' ? <AdminSponsors /> : null}
      {sec === 'notify' ? <AdminNotify /> : null}
      {sec === 'earnings' ? <AdminEarnings /> : null}
      {sec === 'settings' ? <AdminSettings /> : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
