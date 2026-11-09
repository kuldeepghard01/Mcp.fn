// MCP v3 FINAL (APK build)
import React from 'react';
import { View } from 'react-native';

export default function Gradient({ height = 90 }) {
  return <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height, backgroundColor: 'rgba(0,0,0,0.45)' }} />;
}
