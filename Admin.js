import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';

export default function Admin({ moviesList, adminWallet, leaderboardData, winnersList, winnerLogs, onPublish, onWinner, onAddWallet, onAutoFetch, onDeleteMovie, onUpdateMovie, onSendNotification }) {
  const [activeSubTab, setActiveSubTab] = useState('add');

  const [movieTitle, setMovieTitle] = useState('');
  const [category, setCategory] = useState('Bollywood');
  const [releaseDate, setReleaseDate] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingIdentifier, setEditingIdentifier] = useState(null);

  const [targetMovie, setTargetMovie] = useState('');
  const [actualColl, setActualColl] = useState('');
  const [winnerFee, setWinnerFee] = useState(9);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');

  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchedUserResults, setSearchedUserResults] = useState(null);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        setBannerUrl(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setBannerUrl(asset.uri);
      }
      alert('✅ Custom Image Uploaded!');
    }
  };

  const handleAutoSearch = async () => {
    if (!movieTitle) return alert('Enter movie title first!');
    const data = await onAutoFetch(movieTitle);
    if (data) {
      setMovieTitle(data.title);
      setReleaseDate(data.release_date);
      setBannerUrl(data.banner);
      alert('🎉 Details Auto Fetched!');
    } else {
      alert('❌ Movie not found in TMDb/OMDb.');
    }
  };

  const handlePublishClick = async () => {
    if (isEditing) {
      await onUpdateMovie(editingIdentifier, movieTitle, category, releaseDate, bannerUrl, trailerUrl);
      alert('✅ Movie Updated!');
      setIsEditing(false);
    } else {
      await onPublish(movieTitle, category, releaseDate, releaseDate, bannerUrl, trailerUrl);
      alert('🚀 Movie Published!');
    }
    setMovieTitle(''); setReleaseDate(''); setBannerUrl(''); setTrailerUrl('');
  };

  const handleSearchUser = () => {
    if (!searchUserQuery.trim()) return alert('Enter Name or Phone Number.');
    const query = searchUserQuery.trim().toLowerCase();

    const userPreds = leaderboardData.filter(p => p.user_phone?.toLowerCase().includes(query));
    if (userPreds.length === 0) {
      return alert('No user found with this details.');
    }

    setSearchedUserResults({
      userInfo: userPreds[0].user_phone,
      totalPredictions: userPreds.length,
      predictions: userPreds
    });
  };

  return (
    <ScrollView style={styles.listSection}>
      <View style={styles.adminCard}>
        <Text style={styles.adminHead}>⚡ Admin Dashboard</Text>
        <Text style={{ color: '#00ff87', fontWeight: 'bold', marginBottom: 10 }}>💼 Admin Pool Wallet: ₹{Math.round(adminWallet)}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
          {['add', 'manage', 'winner', 'notif', 'usersearch', 'logs'].map(t => (
            <TouchableOpacity key={t} style={[styles.filterChip, activeSubTab === t && styles.activeFilterChip]} onPress={() => setActiveSubTab(t)}>
              <Text style={{ color: '#fff', fontSize: 10, textTransform: 'uppercase' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeSubTab === 'add' && (
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>{isEditing ? '✏️ Edit Movie' : '🎬 Add Movie'}</Text>
            <View style={{ flexDirection: 'row' }}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 5 }]} placeholder="Movie Title" placeholderTextColor="#666" value={movieTitle} onChangeText={setMovieTitle} />
              <TouchableOpacity style={{ backgroundColor: '#2196F3', padding: 8, borderRadius: 6, marginBottom: 10 }} onPress={handleAutoSearch}>
                <Text style={{ color: '#fff', fontSize: 11 }}>🔍 Auto</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Category (Bollywood/Hollywood)" placeholderTextColor="#666" value={category} onChangeText={setCategory} />
            <TextInput style={styles.input} placeholder="Release Date (YYYY-MM-DD)" placeholderTextColor="#666" value={releaseDate} onChangeText={setReleaseDate} />
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 5 }]} placeholder="Banner Image URL / Upload" placeholderTextColor="#666" value={bannerUrl} onChangeText={setBannerUrl} />
              <TouchableOpacity style={{ backgroundColor: '#8a2be2', padding: 8, borderRadius: 6 }} onPress={handlePickImage}>
                <Text style={{ color: '#fff', fontSize: 11 }}>📷 Upload</Text>
              </TouchableOpacity>
            </View>

            {bannerUrl ? <Image source={{ uri: bannerUrl }} style={{ width: '100%', height: 90, borderRadius: 6, marginBottom: 10 }} resizeMode="cover" /> : null}

            <TextInput style={styles.input} placeholder="YouTube Trailer Link" placeholderTextColor="#666" value={trailerUrl} onChangeText={setTrailerUrl} />

            <TouchableOpacity style={styles.primaryBtn} onPress={handlePublishClick}>
              <Text style={styles.primaryBtnText}>{isEditing ? 'Update Movie' : 'Publish Contest'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSubTab === 'manage' && (
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>📋 Active Movies</Text>
            {moviesList.map((m, idx) => (
              <View key={idx} style={{ backgroundColor: '#222', padding: 8, borderRadius: 6, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 11, flex: 1 }}>{m.title}</Text>
                <TouchableOpacity style={{ backgroundColor: '#2196F3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginRight: 4 }} onPress={() => { setMovieTitle(m.title); setCategory(m.category); setReleaseDate(m.release_date); setBannerUrl(m.banner); setTrailerUrl(m.trailer_url); setIsEditing(true); setEditingIdentifier(m.title); setActiveSubTab('add'); }}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ backgroundColor: '#e50914', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }} onPress={() => onDeleteMovie(m.title)}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeSubTab === 'winner' && (
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>🏆 Declare Winner Manually</Text>
            <TextInput style={styles.input} placeholder="Movie Title" placeholderTextColor="#666" value={targetMovie} onChangeText={setTargetMovie} />
            <TextInput style={styles.input} placeholder="Actual Day 1 Collection (Cr)" placeholderTextColor="#666" keyboardType="numeric" value={actualColl} onChangeText={setActualColl} />
            
            <View style={{ flexDirection: 'row', marginBottom: 8, gap: 6 }}>
              {[9, 49, 99].map(f => (
                <TouchableOpacity key={f} style={[styles.filterChip, winnerFee === f && styles.activeFilterChip]} onPress={() => setWinnerFee(f)}>
                  <Text style={{ color: '#fff', fontSize: 11 }}>₹{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#00ff87' }]} onPress={() => { onWinner(targetMovie, actualColl, winnerFee); setTargetMovie(''); setActualColl(''); }}>
              <Text style={{ color: '#000', fontWeight: 'bold' }}>Declare & Pay Winner</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSubTab === 'notif' && (
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>🔔 Send Broadcast Push Notification</Text>
            <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#666" value={notifTitle} onChangeText={setNotifTitle} />
            <TextInput style={styles.input} placeholder="Message" placeholderTextColor="#666" value={notifMsg} onChangeText={setNotifMsg} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { onSendNotification(notifTitle, notifMsg); setNotifTitle(''); setNotifMsg(''); }}>
              <Text style={styles.primaryBtnText}>Send Notification 📢</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSubTab === 'usersearch' && (
          <View>
            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 6 }}>👤 User Details Deep Search</Text>
            <TextInput style={styles.input} placeholder="Name or Phone" placeholderTextColor="#666" value={searchUserQuery} onChangeText={setSearchUserQuery} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSearchUser}>
              <Text style={styles.primaryBtnText}>Search</Text>
            </TouchableOpacity>

            {searchedUserResults && (
              <View style={{ backgroundColor: '#222', padding: 8, borderRadius: 6, marginTop: 10 }}>
                <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 12 }}>User: {searchedUserResults.userInfo}</Text>
                <Text style={{ color: '#ccc', fontSize: 11 }}>Total Predictions: {searchedUserResults.totalPredictions}</Text>
                {searchedUserResults.predictions.map((p, idx) => (
                  <View key={idx} style={{ backgroundColor: '#333', padding: 4, borderRadius: 4, marginTop: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 10 }}>🎬 {p.movie_title} | ₹{p.predicted_amount} Cr</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeSubTab === 'logs' && (
          <View>
            <Text style={{ color: '#FFD700', fontWeight: 'bold', marginBottom: 6 }}>🛡️ Winner Safety Records & Payout History</Text>
            {winnerLogs.length === 0 ? (
              <Text style={{ color: '#aaa', fontSize: 11 }}>No winner logs recorded yet.</Text>
            ) : (
              winnerLogs.map((log, idx) => (
                <View key={idx} style={{ backgroundColor: '#222', padding: 8, borderRadius: 6, marginBottom: 6 }}>
                  <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 11 }}>👑 Winner: {log.winnerPhone}</Text>
                  <Text style={{ color: '#fff', fontSize: 10 }}>🎬 Movie: {log.movieTitle} | Fee: ₹{log.fee}</Text>
                  <Text style={{ color: '#00ff87', fontSize: 10 }}>💰 Payout: ₹{log.prize} | Target: ₹{log.actual} Cr</Text>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
