// MCP v3 FINAL (APK build)
import React from 'react';
import { Image } from 'react-native';

export default function Poster({ uri, style }) {
  return <Image source={{ uri: uri }} style={style} resizeMode="cover" />;
}
