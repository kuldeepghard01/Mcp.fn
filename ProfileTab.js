// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, Share } from 'react-native';
import { styles } from './styles';
import { C, Btn } from './ui';
import { rpc, getEmail } from './api';
import { fmtNum, APP_VERSION } from './constants';

export default function ProfileTab({ profile, settings, onTerms, onLogout, onDelete }) {
  const [ref, setRef] = useState(null);
  useEffect(() => {
    rpc('mcp_my_referrals', {}).then(setRef).catch(() => {});
  }, []);
  const st = settings || {};
  const bonus = Number(st.referral_bonus || 5000);
  const cap = Number(st.referral_daily_cap || 7);
  const life = Number(st.referral_lifetime_cap || 20);

  const share = async () => {
    if (!ref || !ref.code) return;
    try {
      await Share.share({
        message: "Join me on MCP Fantasy, the free movie prediction game! Use my referral code " + ref.code + " when you sign up. Predict a movie's Day 1 collection and win coins.",
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

        <View style={{ marginTop: 12, padding: 12, backgroundColor: '#14261a', borderRadius: 8, borderWidth: 1, borderColor: '#1b5e20' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>🎁 Invite friends</Text>
          <Text style={{ color: '#bbb', fontSize: 12, marginVertical: 4 }}>
            {'Get ' + fmtNum(bonus) + ' coins when a friend signs up with your code and joins their first contest. Up to ' + cap + ' friends per day, ' + life + ' in total.'}
          </Text>
          <Text selectable style={{ color: C.green, fontSize: 24, fontWeight: 'bold', letterSpacing: 3 }}>{ref ? ref.code : '...'}</Text>
          <Text style={{ color: C.sub, fontSize: 11, marginVertical: 4 }}>
            {ref ? 'Friends joined: ' + ref.friends_total + '   |   Rewarded: ' + ref.friends_paid + '   |   Today: ' + ref.today_paid + '/' + cap : ''}
          </Text>
          <Btn title="📤 Share my code" onPress={share} disabled={!ref} small />
        </View>

        <Btn title="📜 Terms & Privacy" color="#333" onPress={onTerms} style={{ marginTop: 12 }} />
        <Btn title="🚪 Log out" color="#333" onPress={onLogout} style={{ marginTop: 8 }} />
        <Btn title="🗑 Delete my account" color="#7f1d1d" onPress={onDelete} style={{ marginTop: 8 }} />
        <Text style={{ color: '#555', fontSize: 10, textAlign: 'center', marginTop: 12 }}>{'Version ' + APP_VERSION}</Text>
      </View>
    </ScrollView>
  );
}
