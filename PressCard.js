// MCP v3 FINAL (APK build)
import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback } from 'react-native';

// A card that shrinks a little while pressed, like in big apps.
export default function PressCard({ onPress, style, children }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  return (
    <TouchableWithoutFeedback onPress={onPress} onPressIn={() => to(0.98)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </TouchableWithoutFeedback>
  );
}
