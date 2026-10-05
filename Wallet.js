import React, { useState, useEffect } from 'react';
import { View, Text, Image, Linking } from 'react-native';
import { C, notify, confirmBox, Btn, Field, Chips, Sheet, Tag, dateText } from './ui';
import { rpc, select, getUserId } from './api';
import { CURRENCIES, curInfo, fmt, UPI_ID, UPI_NAME, MIN_REDEEM_RS } from './constants';

const statusColor = (s) => (s === 'approved' || s === 'paid' ? '#1b5e20' : s === 'rejected' ? '#b71c1c' : '#8d6e00');
const kindText = {
  purchase: 'Kharida', entry: 'Contest entry', prize: 'Inaam', refund: 'Refund',
  redeem: 'Redeem', redeem_refund: 'Redeem wapas', admin_adjust: 'Admin adjust',
};

export default function WalletModal({ visible, onClose, balances, onChanged }) {
  const [tab, setTab] = useState('buy');
  const [busy, setBusy] = useState(false);
  // buy
  const [buyCur, setBuyCur] = useState('coin');
  const [qty, setQty] = useState('1');
  const [utr, setUtr] = useState('');
  const [deposits, setDeposits] = useState([]);
  // redeem
  const [rCur, setRCur] = useState('coin');
  const [rQty, setRQty] = useState('');
  const [withdrawals, setWithdrawals] = useState([]);
  // payout account
  const [method, setMethod] = useState('upi');
  const [upi, setUpi] = useState('');
  const [holder, setHolder] = useState('');
  const [accNo, setAccNo] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [saved, setSaved] = useState(null);
  // history
  const [tx, setTx] = useState([]);

  const loadAll = async () => {
    const uid = getUserId();
    if (!uid) return;
    try { setDeposits((await select('mcp_deposits', 'user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=15')) || []); } catch (e) {}
    try { setWithdrawals((await select('mcp_withdrawals', 'user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=15')) || []); } catch (e) {}
    try {
      const a = await select('mcp_payout_accounts', 'user_id=eq.' + uid + '&select=*');
      if (a && a[0]) {
        setSaved(a[0]);
        setMethod(a[0].method);
        setUpi(a[0].upi_id || '');
        setHolder(a[0].holder_name || '');
        setIfsc(a[0].ifsc || '');
      } else {
        setSaved(null);
      }
    } catch (e) {}
    try { setTx((await select('mcp_tx', 'user_id=eq.' + uid + '&select=*&order=created_at.desc&limit=40')) || []); } catch (e) {}
  };

  useEffect(() => {
    if (visible) loadAll();
  }, [visible]);

  const q = parseInt(qty, 10);
  const buyInfo = curInfo(buyCur);
  const rupees = isNaN(q) ? 0 : q * buyInfo.rupees;
  const upiLink = 'upi://pay?pa=' + UPI_ID + '&pn=' + encodeURIComponent(UPI_NAME) + '&am=' + rupees + '&cu=INR&tn=' + encodeURIComponent('MCP ' + buyInfo.label + ' x' + (isNaN(q) ? 0 : q));
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(upiLink);

  const openUpi = async () => {
    try { await Linking.openURL(upiLink); } catch (e) { notify('UPI app nahi khul paya. QR scan karke pay karein.'); }
  };

  const submitBuy = async () => {
    if (isNaN(q) || q < 1 || q > 1000) { notify('Quantity 1 se 1000 ke beech rakhein.'); return; }
    if (!/^[0-9]{12}$/.test(utr.trim())) { notify('UTR 12 digit ka hona chahiye.'); return; }
    setBusy(true);
    try {
      await rpc('mcp_buy_request', { p_cur: buyCur, p_qty: q, p_utr: utr.trim() });
      notify('Request bhej di gayi. Admin payment verify karke ' + buyInfo.label + ' add kar dega.');
      setUtr('');
      loadAll();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const rInfo = curInfo(rCur);
  const rq = parseFloat(rQty);
  const rRupees = isNaN(rq) ? 0 : Math.round(rq * rInfo.rupees * 100) / 100;

  const submitRedeem = async () => {
    if (isNaN(rq) || rq <= 0) { notify('Kitna redeem karna hai wo daalein.'); return; }
    if (rq > Number((balances || {})[rCur] || 0)) { notify('Itne ' + rInfo.label + ' aapke paas nahi hain.'); return; }
    if (rRupees < MIN_REDEEM_RS) { notify('Minimum redeem value Rs ' + MIN_REDEEM_RS + ' hai.'); return; }
    if (!saved) { notify('Pehle Account tab me apna payout account save karein.'); setTab('account'); return; }
    const ok = await confirmBox(fmt(rq) + ' ' + rInfo.label + ' redeem karke Rs ' + fmt(rRupees) + ' apne account me mangwayein?');
    if (!ok) return;
    setBusy(true);
    try {
      await rpc('mcp_redeem_request', { p_cur: rCur, p_qty: rq });
      notify('Redeem request bhej di gayi. Admin verify karke paise bhej dega.');
      setRQty('');
      loadAll();
      onChanged();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const saveAccount = async () => {
    setBusy(true);
    try {
      await rpc('mcp_save_payout_account', { p_method: method, p_upi: upi, p_holder: holder, p_account: accNo, p_ifsc: ifsc });
      notify('Payout account save ho gaya.');
      setAccNo('');
      loadAll();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  return (
    <Sheet visible={visible} title="👛 My Wallet" onClose={onClose}>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {CURRENCIES.map((c) => (
          <View key={c.cur} style={{ flex: 1, backgroundColor: C.card, borderRadius: 8, padding: 8, marginRight: 6, borderWidth: 1, borderColor: c.color, alignItems: 'center' }}>
            <Text style={{ fontSize: 18 }}>{c.icon}</Text>
            <Text style={{ color: c.color, fontWeight: 'bold', fontSize: 16 }}>{fmt((balances || {})[c.cur] || 0)}</Text>
            <Text style={{ color: C.sub, fontSize: 9 }}>{c.label}</Text>
          </View>
        ))}
      </View>
      <Chips
        options={[{ key: 'buy', label: '➕ Kharidein' }, { key: 'redeem', label: '💸 Redeem' }, { key: 'account', label: '🏦 Account' }, { key: 'history', label: '🧾 History' }]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'buy' ? (
        <View>
          <Text style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>1 Coin = Rs 9  |  1 Diamond = Rs 49  |  1 Red Diamond = Rs 99</Text>
          <Chips options={CURRENCIES.map((c) => ({ key: c.cur, label: c.icon + ' ' + c.label }))} value={buyCur} onChange={setBuyCur} />
          <Field label="Kitne chahiye" value={qty} onChangeText={setQty} keyboardType="number-pad" maxLength={4} />
          <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 15, marginBottom: 8 }}>{'Pay karein: Rs ' + rupees}</Text>
          {rupees > 0 ? (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <Image source={{ uri: qrUrl }} style={{ width: 200, height: 200, backgroundColor: '#fff' }} />
              <Text style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{'UPI ID: ' + UPI_ID}</Text>
            </View>
          ) : null}
          <Btn title="📲 UPI App se pay karein" color={C.blue} onPress={openUpi} disabled={rupees <= 0} style={{ marginBottom: 10 }} />
          <Field label="Pay karne ke baad 12 digit UTR / Ref No." value={utr} onChangeText={setUtr} keyboardType="number-pad" maxLength={12} placeholder="123456789012" />
          <Btn title={busy ? 'Please wait...' : 'Request bhejein'} onPress={submitBuy} disabled={busy} />
          <Text style={{ color: '#777', fontSize: 10, marginTop: 8 }}>
            Admin payment verify karne ke baad hi balance add hota hai. Sahi amount hi pay karein.
          </Text>
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 14, marginBottom: 6 }}>Meri requests</Text>
          {deposits.length === 0 ? <Text style={{ color: C.sub, fontSize: 12 }}>Koi request nahi.</Text> : null}
          {deposits.map((d) => (
            <View key={d.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{d.qty + ' x ' + curInfo(d.cur).icon + ' = Rs ' + fmt(d.rupees)}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>{dateText(d.created_at) + '  UTR ' + d.utr}</Text>
              </View>
              <Tag text={d.status.toUpperCase()} color={statusColor(d.status)} />
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'redeem' ? (
        <View>
          <Chips options={CURRENCIES.map((c) => ({ key: c.cur, label: c.icon + ' ' + c.label }))} value={rCur} onChange={setRCur} />
          <Text style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{'Aapke paas: ' + fmt((balances || {})[rCur] || 0) + ' ' + rInfo.icon}</Text>
          <Field label="Kitne redeem karne hain" value={rQty} onChangeText={setRQty} keyboardType="decimal-pad" maxLength={8} />
          <Text style={{ color: C.gold, fontWeight: 'bold', marginBottom: 8 }}>{'Aapko milenge: Rs ' + fmt(rRupees) + '  (minimum Rs ' + MIN_REDEEM_RS + ')'}</Text>
          {saved ? (
            <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
              {'Paise yahan jayenge: ' + (saved.method === 'upi' ? 'UPI ' + saved.upi_id : 'Bank ' + (saved.holder_name || '') + ' (A/C ' + 'XXXX' + ')')}
            </Text>
          ) : (
            <Text style={{ color: '#ff9800', fontSize: 11, marginBottom: 8 }}>Pehle Account tab me payout account save karein.</Text>
          )}
          <Btn title={busy ? 'Please wait...' : 'Redeem Request'} onPress={submitRedeem} disabled={busy} />
          <Text style={{ color: '#fff', fontWeight: 'bold', marginTop: 14, marginBottom: 6 }}>Meri redeem requests</Text>
          {withdrawals.length === 0 ? <Text style={{ color: C.sub, fontSize: 12 }}>Koi request nahi.</Text> : null}
          {withdrawals.map((w) => (
            <View key={w.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{fmt(w.qty) + ' ' + curInfo(w.cur).icon + ' = Rs ' + fmt(w.rupees)}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>{dateText(w.created_at)}</Text>
                {w.admin_note ? <Text style={{ color: C.sub, fontSize: 10 }}>{'Note: ' + w.admin_note}</Text> : null}
              </View>
              <Tag text={w.status.toUpperCase()} color={statusColor(w.status)} />
            </View>
          ))}
        </View>
      ) : null}

      {tab === 'account' ? (
        <View>
          <Text style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>
            Redeem ke paise isi account me jayenge. Sirf apne naam ka account daalein.
          </Text>
          <Chips options={[{ key: 'upi', label: 'UPI' }, { key: 'bank', label: 'Bank Account' }]} value={method} onChange={setMethod} />
          {method === 'upi' ? (
            <Field label="UPI ID" value={upi} onChangeText={setUpi} placeholder="name@bank" />
          ) : (
            <View>
              <Field label="Account holder ka naam" value={holder} onChangeText={setHolder} autoCapitalize="words" />
              <Field label={saved && saved.method === 'bank' ? 'Account number (naya daalein, purana chhupa hai)' : 'Account number'} value={accNo} onChangeText={setAccNo} keyboardType="number-pad" maxLength={18} />
              <Field label="IFSC code" value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" maxLength={11} placeholder="SBIN0001234" />
            </View>
          )}
          <Btn title={busy ? 'Please wait...' : 'Save Account'} onPress={saveAccount} disabled={busy} />
        </View>
      ) : null}

      {tab === 'history' ? (
        <View>
          {tx.length === 0 ? <Text style={{ color: C.sub, fontSize: 12 }}>Abhi koi history nahi.</Text> : null}
          {tx.map((t) => (
            <View key={t.id} style={{ backgroundColor: C.card, padding: 10, borderRadius: 8, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{(kindText[t.kind] || t.kind) + (t.note ? ' - ' + t.note : '')}</Text>
                <Text style={{ color: '#666', fontSize: 10 }}>{dateText(t.created_at)}</Text>
              </View>
              <Text style={{ color: Number(t.amount) >= 0 ? C.green : '#ff5252', fontWeight: 'bold' }}>
                {(Number(t.amount) >= 0 ? '+' : '') + fmt(t.amount) + ' ' + curInfo(t.cur).icon}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Sheet>
  );
}
