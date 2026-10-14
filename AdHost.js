// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { Modal, View, Text } from 'react-native';
import { Btn } from './ui';
import { registerAdHost } from './adsSim';

// Shows the simulated test ad (web / test mode). Real ads use the AdMob screen.
export default function AdHost() {
  const [job, setJob] = useState(null);
  const [left, setLeft] = useState(5);

  useEffect(() => registerAdHost((j) => { setJob(j); setLeft(5); }), []);

  useEffect(() => {
    if (!job || left <= 0) return;
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [job, left]);

  const finish = (res) => {
    const j = job;
    setJob(null);
    if (j) j.done(res);
  };

  if (!job) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => finish('dismissed')}>
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#888', fontSize: 11, marginBottom: 12 }}>TEST AD (real ads appear in the Android app)</Text>
        <View style={{ width: '100%', height: 220, backgroundColor: '#1a1a1a', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Your ad here</Text>
          <Text style={{ color: '#aaa', fontSize: 12, marginTop: 6 }}>{job.label}</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: 14, marginTop: 18 }}>
          {left > 0 ? 'Reward in ' + left + 's' : 'Ad finished'}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Btn title="Close" color="#333" onPress={() => finish('dismissed')} style={{ marginRight: 10 }} />
          <Btn title="Claim reward" onPress={() => finish('earned')} disabled={left > 0} />
        </View>
      </View>
    </Modal>
  );
}
