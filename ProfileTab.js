// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, Share, Linking } from 'react-native';
import { styles } from './styles';
import { C, Btn, notify } from './ui';
import { rpc, getEmail } from './api';
import { fmtNum, APP_VERSION } from './constants';

let Updates = null;
try {
  Updates = require('expo-updates');
} catch (e) {
  Updates = null;
}

const LEVELS = [['Rookie', 0], ['Movie Fan', 100], ['Critic', 400], ['Analyst', 1000], ['Box Office Pro', 2500], ['Legend', 6000]];

const playerStats = (entries, daily) => {
  const list = entries || [];
  const done = list.filter((e) => e.final_rank);
  const top10 = done.filter((e) => e.final_rank <= 10).length;
  const accSum = done.reduce((a, e) => a + Number(e.collection_score || 0), 0);
  const xp = list.length * 20 + top10 * 100 + Math.floor(accSum / 5);
  let li = 0;
  LEVELS.forEach((l, i) => { if (xp >= l[1]) li = i; });
  const next = LEVELS[li + 1] || null;
  const badges = [];
  if (list.length >= 1) badges.push('🎬 First prediction');
  if (list.length >= 10) badges.push('🎯 10 predictions');
  if (done.some((e) => Number(e.collection_score) >= 90)) badges.push('🔬 Sharp eye (90+ accuracy)');
  if (top10 >= 1) badges.push('🏅 Top 10 finish');
  if (daily && daily.streak >= 7) badges.push('🔥 7 day streak');
  return {
    joined: list.length, top10: top10, xp: xp, level: LEVELS[li][0], base: LEVELS[li][1], next: next, badges: badges,
    avg: done.length ? Math.round(accSum / done.length) : null,
    best: done.length ? Math.min.apply(null, done.map((e) => e.final_rank)) : null,
  };
};

const updateLabel = () => {
  try {
    if (Updates && Updates.isEnabled) return Updates.updateId ? String(Updates.updateId).slice(0, 8) : 'built-in';
  } catch (e) {}
  return 'off';
};

export default function ProfileTab({ profile, settings, entries, daily, onTerms, onHowTo, onLogout, onDelete }) {
  const [ref, setRef] = useState(null);
  useEffect(() => {
    rpc('mcp_my_referrals', {}).then(setRef).catch(() => {});
  }, []);
  const st = settings || {};
  const bonus = Number(st.referral_bonus || 5000);
  const cap = Number(st.referral_daily_cap || 7);
  const life = Number(st.referral_lifetime_cap || 20);
  const fgift = Number(st.referral_friend_bonus || 3000);
  const link = String(st.app_link || '').trim();
  const privacy = String(st.privacy_url || '').trim();
  const support = String(st.support_email || '').trim();

  const checkUpdate = async () => {
    try {
      if (!Updates || !Updates.isEnabled) {
        notify('This version cannot get live updates. Please install the latest app from the download link.');
        return;
      }
      const r = await Updates.checkForUpdateAsync();
      if (r.isAvailable) {
        await Updates.fetchUpdateAsync();
        notify('Update downloaded. The app will restart now.');
        await Updates.reloadAsync();
      } else {
        notify('You already have the latest version.');
      }
    } catch (e) {
      notify('Could not check for updates: ' + e.message);
    }
  };

  const ps = playerStats(entries, daily);
  const pct = ps.next ? Math.min(100, Math.floor(((ps.xp - ps.base) / (ps.next[1] - ps.base)) * 100)) : 100;

  const share = async () => {
    if (!ref || !ref.code) return;
    try {
      await Share.share({
        message: "Join me on MCP Fantasy, the free movie prediction game! Use my referral code " + ref.code + " when you sign up. Predict a movie's Day 1 collection and win coins." + (link ? " Download the app: " + link : ''),
      });
    } catch (e) {}
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: "Try MCP Fantasy, the free movie prediction game! Predict a movie's Day 1 collection and win coins." + (link ? " Download the app: " + link : ''),
      });
    } catch (e) {}
  };

  return (
    <ScrollView style={styles.listSection}>
      <View style={styles.adminCard}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{'👤 ' + (profile ? profile.name : '')}</Text>
        <Text style={{ color: C.sub, fontSize: 12 }}>{'✉️ ' + getEmail()}</Text>
        <Text style={{ color: C.sub, fontSize: 12 }}>{'📞 ' + (profile && profile.phone ? '+' + profile.phone : '-')}</Text>
        <View style={{ marginTop: 14, padding: 12, backgroundColor: C.card2, borderRadius: 8 }}>
          <Text style={{ color: C.sub, fontSize: 11 }}>Coins</Text>
          <Text style={{ color: C.gold, fontSize: 22, fontWeight: 'bold' }}>{'🪙 ' + fmtNum(profile ? profile.coins : 0)}</Text>
        </View>

        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#1a1a2e', borderRadius: 8, borderWidth: 1, borderColor: '#33335a' }}>
          <Text style={{ color: C.sub, fontSize: 11 }}>Your level</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{'⭐ ' + ps.level}</Text>
          <View style={{ height: 6, backgroundColor: '#2a2a40', borderRadius: 3, marginVertical: 6 }}>
            <View style={{ height: 6, width: pct + '%', backgroundColor: C.gold, borderRadius: 3 }} />
          </View>
          <Text style={{ color: C.sub, fontSize: 11 }}>
            {ps.next ? fmtNum(ps.xp) + ' / ' + fmtNum(ps.next[1]) + ' XP to ' + ps.next[0] : fmtNum(ps.xp) + ' XP. Top level reached!'}
          </Text>
          <Text style={{ color: '#bbb', fontSize: 12, marginTop: 8 }}>
            {'Predictions: ' + ps.joined + '   |   Top 10 finishes: ' + ps.top10 + '   |   Best rank: ' + (ps.best ? '#' + ps.best : '-') + '   |   Avg accuracy: ' + (ps.avg !== null ? ps.avg + '%' : '-')}
          </Text>
          {ps.badges.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {ps.badges.map((b) => (
                <View key={b} style={{ backgroundColor: '#2a2a40', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, marginBottom: 6 }}>
                  <Text style={{ color: '#ddd', fontSize: 11 }}>{b}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#14261a', borderRadius: 8, borderWidth: 1, borderColor: '#1b5e20' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>🎁 Invite friends</Text>
          <Text style={{ color: '#bbb', fontSize: 12, marginVertical: 4 }}>
            {'Get ' + fmtNum(bonus) + ' coins when a friend signs up with your code and joins their first contest. Up to ' + cap + ' friends per day, ' + life + ' in total. Your friend also gets ' + fmtNum(fgift) + ' coins.'}
          </Text>
          <Text selectable style={{ color: C.green, fontSize: 24, fontWeight: 'bold', letterSpacing: 3 }}>{ref ? ref.code : '...'}</Text>
          <Text style={{ color: C.sub, fontSize: 11, marginVertical: 4 }}>
            {ref ? 'Friends joined: ' + ref.friends_total + '   |   Rewarded: ' + ref.friends_paid + '   |   Today: ' + ref.today_paid + '/' + cap : ''}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Btn title="📤 Share my code" onPress={share} disabled={!ref} small style={{ marginRight: 8 }} />
            <Btn title="📲 Share app" onPress={shareApp} color="#333" small />
          </View>
        </View>

        <Btn title="❓ How to play" color="#333" onPress={onHowTo} style={{ marginTop: 12 }} />
        <Btn title="📜 Terms" color="#333" onPress={onTerms} style={{ marginTop: 8 }} />
        <Btn title="🔒 Privacy Policy" color="#333" onPress={() => { if (privacy) Linking.openURL(privacy).catch(() => onTerms()); else onTerms(); }} style={{ marginTop: 8 }} />
        {support ? <Btn title="✉️ Contact support" color="#333" onPress={() => Linking.openURL('mailto:' + support).catch(() => {})} style={{ marginTop: 8 }} /> : null}
        <Btn title="🔄 Check for updates" color="#333" onPress={checkUpdate} style={{ marginTop: 8 }} />
        <Btn title="🚪 Log out" color="#333" onPress={onLogout} style={{ marginTop: 8 }} />
        <Btn title="🗑 Delete my account" color="#7f1d1d" onPress={onDelete} style={{ marginTop: 8 }} />
        <Text style={{ color: '#555', fontSize: 10, textAlign: 'center', marginTop: 12 }}>{'Version ' + APP_VERSION + '  |  Update: ' + updateLabel()}</Text>
      </View>
    </ScrollView>
  );
}
