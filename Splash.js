// MCP v3 FINAL (APK build)
import React, { useEffect, useRef } from 'react';
import { Text, View, Animated, Easing } from 'react-native';

// ---------- Splash Screen (logo + zoom animation, ~1.7 sec) ----------
export default function SplashScreen({ onFinish }) {
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(500),
          Animated.parallel([
            Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(textScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          ]),
        ]),
      ]),
      Animated.delay(400),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Image
        source={require('./icon.png')}
        style={{ width: 230, height: 230, opacity: logoOpacity, transform: [{ scale: logoScale }] }}
        resizeMode="contain"
      />
      <Animated.View style={{ alignItems: 'center', marginTop: 24, opacity: textOpacity, transform: [{ scale: textScale }] }}>
        <Text style={{ color: '#FFD700', fontSize: 40, fontWeight: 'bold', letterSpacing: 6 }}>MCP</Text>
        <Text style={{ color: '#fff', fontSize: 16, letterSpacing: 2, marginTop: 6 }}>Movie Collection Prediction</Text>
      </Animated.View>
    </View>
  );
}
