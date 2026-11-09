// MCP v3 FINAL (APK build)
import React from 'react';
import { Image } from 'expo-image';

// Cached on the phone and fades in softly.
export default function Poster({ uri, style }) {
  return <Image source={{ uri: uri }} style={style} contentFit="cover" transition={250} cachePolicy="memory-disk" />;
}
