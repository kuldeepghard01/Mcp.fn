// MCP v3 FINAL (APK build)
import React, { useState } from 'react';
import { Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styles } from './styles';
import { TermsModal } from './Modals';
import { C, notify, Btn, Field } from './ui';
import { signIn, signUp, recover } from './api';

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '').trim());

export default function AuthScreen({ onLoggedIn }) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPass, setFPass] = useState('');
  const [fRef, setFRef] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    if (!isEmail(fEmail) || !fPass) { notify('Enter your email and password.'); return; }
    setBusy(true);
    try {
      await signIn(fEmail.trim().toLowerCase(), fPass);
      onLoggedIn();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const doRegister = async () => {
    if (fName.trim().length < 2) { notify('Enter your name.'); return; }
    if (!isEmail(fEmail)) { notify('Enter a valid email address.'); return; }
    if (!/^[0-9]{7,15}$/.test(fPhone.trim())) { notify('Enter your phone number with country code, digits only (7 to 15 digits).'); return; }
    if (fPass.length < 8) { notify('Password must be at least 8 characters.'); return; }
    if (!agree) { notify('Please confirm you are 18+ and accept the Terms.'); return; }
    setBusy(true);
    try {
      await signUp({ email: fEmail.trim().toLowerCase(), password: fPass, name: fName.trim(), phone: fPhone.trim(), referral: fRef.trim() });
      notify('Welcome to MCP Fantasy! Check the Coins tab for your welcome bonus.');
      onLoggedIn();
    } catch (e) {
      notify(e.message);
    }
    setBusy(false);
  };

  const doForgot = async () => {
    if (!isEmail(fEmail)) { notify('Enter your email above first.'); return; }
    try {
      await recover(fEmail.trim().toLowerCase());
      notify('A password reset link has been sent to your email.');
    } catch (e) {
      notify(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 18 }} keyboardShouldPersistTaps="handled">
        <View style={styles.authCard}>
          <Text style={styles.authLogo}>🎬 MCP Fantasy</Text>
          <Text style={styles.authSub}>Movie Collection Prediction</Text>
          <View style={{ flexDirection: 'row', marginBottom: 14 }}>
            <TouchableOpacity style={[styles.tabItem, mode === 'login' && styles.activeTab]} onPress={() => setMode('login')}>
              <Text style={styles.tabText}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabItem, mode === 'register' && styles.activeTab]} onPress={() => setMode('register')}>
              <Text style={styles.tabText}>Create account</Text>
            </TouchableOpacity>
          </View>
          {mode === 'register' ? <Field label="Name" value={fName} onChangeText={setFName} autoCapitalize="words" maxLength={30} /> : null}
          <Field label="Email" value={fEmail} onChangeText={setFEmail} keyboardType="email-address" />
          {mode === 'register' ? <Field label="Phone (with country code, digits only)" value={fPhone} onChangeText={setFPhone} keyboardType="phone-pad" maxLength={15} /> : null}
          {mode === 'register' ? <Field label="Referral code (optional)" value={fRef} onChangeText={(v) => setFRef(v.toUpperCase())} autoCapitalize="characters" maxLength={12} /> : null}
          <Field label="Password (at least 8 characters)" value={fPass} onChangeText={setFPass} secure />
          {mode === 'register' ? (
            <View style={{ marginBottom: 12 }}>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }} onPress={() => setAgree(!agree)}>
                <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: C.sub, backgroundColor: agree ? C.red : 'transparent', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                  {agree ? <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text> : null}
                </View>
                <Text style={{ color: '#ccc', fontSize: 11, flex: 1 }}>I am 18 or older and I accept the Terms and Privacy Policy.</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTermsOpen(true)}>
                <Text style={{ color: C.blue, fontSize: 11, marginTop: 6 }}>📜 Read Terms and Privacy</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Btn title={busy ? 'Please wait...' : (mode === 'login' ? 'Log in' : 'Create account')} onPress={mode === 'login' ? doLogin : doRegister} disabled={busy} />
          {mode === 'login' ? (
            <TouchableOpacity onPress={doForgot}>
              <Text style={{ color: C.blue, fontSize: 12, textAlign: 'center', marginTop: 12 }}>Forgot password?</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
      <TermsModal visible={termsOpen} onClose={() => setTermsOpen(false)} />
    </SafeAreaView>
  );
}
