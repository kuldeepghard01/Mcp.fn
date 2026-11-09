// MCP v3 FINAL (APK build)
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

// Dark fade at the bottom of a poster so the text on it is easy to read.
export default function Gradient({ height = 90 }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['transparent', 'rgba(0,0,0,0.92)']}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height }}
    />
  );
}
