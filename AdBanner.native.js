// MCP v3 FINAL (APK build)
import React from 'react';
import { View } from 'react-native';
import { ADMOB } from './constants';

let lib = null;
try {
  lib = require('react-native-google-mobile-ads');
} catch (e) {
  lib = null;
}

export default function AdBanner() {
  if (!lib || !lib.BannerAd) return null;
  const unit = (ADMOB.testMode || !ADMOB.banner) ? lib.TestIds.BANNER : ADMOB.banner;
  return (
    <View style={{ alignItems: 'center', marginVertical: 6 }}>
      <lib.BannerAd unitId={unit} size={lib.BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
    </View>
  );
}
