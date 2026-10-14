// MCP v3 FINAL (APK build)
import React from 'react';
import { View, Text } from 'react-native';

// Web / test placeholder. Real banner ads are in AdBanner.native.js.
export default function AdBanner() {
  return (
    <View style={{ height: 50, marginVertical: 6, backgroundColor: '#161616', borderRadius: 6, borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#555', fontSize: 11 }}>Banner ad space</Text>
    </View>
  );
}
