import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView, Platform, Alert } from 'react-native';

export const C = {
  bg: '#0f0f0f', card: '#1a1a1a', card2: '#222', line: '#333',
  red: '#e50914', green: '#00ff87', gold: '#FFD700', text: '#fff', sub: '#aaa', blue: '#2196F3',
};

export const notify = (msg) => {
  if (Platform.OS === 'web') {
    try { window.alert(String(msg)); } catch (e) {}
  } else {
    Alert.alert('MCP Fantasy', String(msg));
  }
};

export const confirmBox = (msg) =>
  new Promise((resolve) => {
    if (Platform.OS === 'web') {
      let ok = false;
      try { ok = window.confirm(String(msg)); } catch (e) {}
      resolve(ok);
      return;
    }
    Alert.alert('MCP Fantasy', String(msg), [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });

export function Btn({ title, onPress, color, disabled, small, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          backgroundColor: disabled ? '#444' : (color || C.red),
          paddingVertical: small ? 6 : 11,
          paddingHorizontal: small ? 10 : 14,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: small ? 11 : 13 }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, secure, maxLength, multiline, autoCapitalize }) {
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Text style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>{label}</Text> : null}
      <TextInput
        style={{
          backgroundColor: C.card2, color: '#fff', padding: 10, borderRadius: 6,
          borderWidth: 1, borderColor: C.line, fontSize: 13,
          minHeight: multiline ? 70 : undefined,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
        secureTextEntry={!!secure}
        maxLength={maxLength}
        multiline={!!multiline}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
      />
    </View>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
      {options.map((o) => (
        <TouchableOpacity
          key={o.key}
          onPress={() => onChange(o.key)}
          style={{
            backgroundColor: value === o.key ? C.red : C.card2,
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, marginBottom: 6,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11 }}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
        <View style={{ width: '100%', maxHeight: '90%', backgroundColor: '#181818', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.line }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal: 6 }}>
              <Text style={{ color: C.sub, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function Tag({ text, color }) {
  return (
    <View style={{ backgroundColor: color || '#333', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{text}</Text>
    </View>
  );
}

export const dateText = (d) => {
  try {
    const x = new Date(d);
    return x.toLocaleDateString() + ' ' + x.toLocaleTimeString().slice(0, 5);
  } catch (e) {
    return '';
  }
};
