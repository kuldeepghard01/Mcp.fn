// MCP v3 FINAL (APK build)
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { youtubeId } from './constants';

// Plays the YouTube trailer inside the app (portrait), no external app or browser.
export default function TrailerPlayer({ visible, url, title, onClose }) {
  const id = youtubeId(url);
  const html =
    '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin:0;background:#000;">' +
    '<iframe width="100%" height="100%" style="border:0;position:absolute;top:0;left:0;width:100%;height:100%;" ' +
    'src="https://www.youtube.com/embed/' + id + '?autoplay=1&playsinline=1&rel=0&modestbranding=1" ' +
    'allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></body></html>';
  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: 40 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 }}>{title || 'Trailer'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>
        {id ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}>
              <WebView
                originWhitelist={['*']}
                source={{ html: html, baseUrl: 'https://www.youtube.com' }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                startInLoadingState
                renderLoading={() => <ActivityIndicator color="#e50914" style={{ position: 'absolute', top: '45%', alignSelf: 'center' }} />}
                style={{ backgroundColor: '#000' }}
              />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ color: '#aaa', textAlign: 'center' }}>Trailer is not available yet.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
