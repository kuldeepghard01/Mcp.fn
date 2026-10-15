// MCP v3 FINAL (APK build)
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { youtubeId } from './constants';

// Identifies this app to YouTube (YouTube now requires a valid referrer for embedded players).
const ORIGIN = 'https://com.kuldeep.mcp';

// Plays the YouTube trailer inside the app (portrait). If YouTube refuses to play it
// (some videos have embedding turned off), we show a message and an "Open in YouTube" button.
export default function TrailerPlayer({ visible, url, title, onClose }) {
  const id = youtubeId(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (visible) setFailed(false);
  }, [visible, id]);

  const page =
    '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta name="referrer" content="strict-origin-when-cross-origin">' +
    '<style>html,body{margin:0;height:100%;background:#000}#p{width:100%;height:100%}</style></head>' +
    '<body><div id="p"></div><script>' +
    'var post=function(m){if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(m);}};' +
    'var t=document.createElement("script");t.src="https://www.youtube.com/iframe_api";' +
    't.onerror=function(){post("error:load");};document.head.appendChild(t);' +
    'function onYouTubeIframeAPIReady(){new YT.Player("p",{width:"100%",height:"100%",videoId:' + JSON.stringify(id) +
    ',host:"https://www.youtube.com",playerVars:{autoplay:1,playsinline:1,rel:0,modestbranding:1,origin:' + JSON.stringify(ORIGIN) + '},' +
    'events:{onReady:function(e){e.target.playVideo();},onError:function(e){post("error:"+e.data);}}});}' +
    '</script></body></html>';

  const openYoutube = () => {
    Linking.openURL('https://www.youtube.com/watch?v=' + id).catch(() => {});
  };

  return (
    <Modal visible={!!visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: 40 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 }}>{title || 'Trailer'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
          </TouchableOpacity>
        </View>
        {id && !failed ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}>
              <WebView
                originWhitelist={['*']}
                source={{ html: page, baseUrl: ORIGIN }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                onMessage={(e) => {
                  const d = String((e.nativeEvent && e.nativeEvent.data) || '');
                  if (d.indexOf('error') === 0) setFailed(true);
                }}
                onError={() => setFailed(true)}
                onHttpError={() => setFailed(true)}
                renderLoading={() => <ActivityIndicator color="#e50914" style={{ position: 'absolute', top: '45%', alignSelf: 'center' }} />}
                style={{ backgroundColor: '#000' }}
              />
            </View>
            <TouchableOpacity onPress={openYoutube} style={{ marginTop: 14, alignSelf: 'center' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>Trouble playing? Open in YouTube</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: 'bold', textAlign: 'center' }}>
              {id ? 'This trailer cannot be played inside the app.' : 'Trailer is not available yet.'}
            </Text>
            {id ? (
              <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                The video owner may have turned off playing in other apps.
              </Text>
            ) : null}
            {id ? (
              <TouchableOpacity onPress={openYoutube} style={{ marginTop: 16, backgroundColor: '#e50914', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>▶ Open in YouTube</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}
