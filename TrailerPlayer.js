// MCP v3 FINAL (APK build)
import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { youtubeId } from './constants';

// Web version (iframe). The Android app uses TrailerPlayer.native.js (WebView).
export default function TrailerPlayer({ visible, url, title, onClose }) {
  const id = youtubeId(url);
  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: 40 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 }}>{title || 'Trailer'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {id ? (
            React.createElement('iframe', {
              src: 'https://www.youtube.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0',
              style: { width: '100%', height: 260, border: 0 },
              allow: 'autoplay; encrypted-media; picture-in-picture',
              allowFullScreen: true,
            })
          ) : (
            <Text style={{ color: '#aaa', textAlign: 'center' }}>Trailer is not available yet.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
