// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { C, notify, confirmBox, Btn, Field } from './ui';
import { rpc, select } from './api';
import { box, head } from './adminCommon';
import { fmtNum } from './constants';

const LABELS = {
  ad_bonus_coins: 'Coins per bonus ad',
  ad_bonus_daily_cap: 'Bonus ads allowed per user per day',
  ad_bonus_gap_seconds: 'Seconds to wait between bonus ads',
  referral_lifetime_cap: 'Referral bonuses per user in total (lifetime)',
  max_entries_per_movie: 'Entries allowed per user per movie',
  referral_bonus: 'Referral bonus for the inviter (coins)',
  referral_daily_cap: 'Referral bonuses per user per day',
  welcome_bonus_first_count: 'How many early users get the big welcome bonus',
  welcome_bonus_first: 'Big welcome bonus (coins)',
  welcome_bonus_normal: 'Normal welcome bonus (coins)',
  coin_expiry_days: 'Coins expire after (days, 0 = never)',
  redeem_monthly_limit: 'Rewards per user per month',
  redeem_global_monthly_cap: 'Rewards for all users per month',
  redeem_min_account_days: 'Minimum account age to redeem (days)',
  redeem_min_entries: 'Minimum contests joined to redeem',
  est_revenue_per_ad: 'Estimated earning per ad (for estimates only)',
  coin_value: 'Estimated money value of 1 coin',
  currency: 'Currency symbol',
};

export default function AdminSettings() {
  const [rows, setRows] = useState([]);
  const [vals, setVals] = useState({});
  const [busy, setBusy] = useState('');

  const load = async () => {
    try {
      const r = (await select('mcp_settings', 'select=*&order=key.asc')) || [];
      setRows(r);
      const v = {};
      r.forEach((x) => { v[x.key] = x.value; });
      setVals(v);
    } catch (e) {
      notify(e.message);
    }
  };
  useEffect(() => { load(); }, []);

  const save = async (key) => {
    setBusy(key);
    try {
      await rpc('mcp_admin_set_setting', { p_key: key, p_value: vals[key] });
      notify('Saved. It applies right away.');
      await load();
    } catch (e) {
      notify(e.message);
    }
    setBusy('');
  };

  const expire = async () => {
    const ok = await confirmBox('Expire old coins now? Coins older than the expiry period that are still unused will be removed.');
    if (!ok) return;
    try {
      const r = await rpc('mcp_admin_expire_coins', {});
      notify('Done. ' + fmtNum(r.coins) + ' coins expired from ' + fmtNum(r.users) + ' users.');
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <View>
      <Text style={head}>⚙️ App settings</Text>
      <Text style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>Change these any time. No app update is needed.</Text>
      {rows.map((r) => (
        <View key={r.key} style={box}>
          <Field label={LABELS[r.key] || r.key} value={vals[r.key] || ''} onChangeText={(v) => setVals({ ...vals, [r.key]: v })} maxLength={12} />
          <Btn title={busy === r.key ? 'Saving...' : 'Save'} small onPress={() => save(r.key)} disabled={busy === r.key || vals[r.key] === r.value} style={{ alignSelf: 'flex-start' }} />
        </View>
      ))}
      <View style={box}>
        <Text style={head}>⏳ Coin expiry</Text>
        <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
          Expiry runs by itself every night once you turn on the schedule (see the setup step). You can also run it by hand here.
        </Text>
        <Btn title="Expire old coins now" color="#b71c1c" onPress={expire} />
      </View>
    </View>
  );
}
