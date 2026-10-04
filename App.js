import React, { useState, useEffect } from 'react';
import { Text, View, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput, Linking } from 'react-native';
import { styles } from './styles';
import Admin from './Admin';
import { 
  MovieDetailModal, 
  PrivateRoomModal, 
  PredictModal, 
  LeaderboardModal, 
  NotificationsModal, 
  SettingsModal, 
  DisclaimerModal, 
  WalletModal 
} from './Modals';
import { SUPABASE_URL, ADMIN_PHONE, getHeaders, isContestLocked } from './constants';

export default function App() {
  const [activeTab, setActiveTab] = useState('contests');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
 const [walletModal, setWalletModal] = useState(false);
 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasAgreedDisclaimer, setHasAgreedDisclaimer] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const [userName, setUserName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [walletBalance, setWalletBalance] = useState(500);
  const [adminWallet, setAdminWallet] = useState(0);
  const [moviesList, setMoviesList] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [winnersList, setWinnersList] = useState({});
  const [winnerLogs, setWinnerLogs] = useState([]);
  const [privateRooms, setPrivateRooms] = useState([]);

  const [notifications, setNotifications] = useState([
    { title: '🎉 Welcome to MCP Fantasy', message: 'Predict Day 1 Box Office & Win Real Cash!', date: 'Today' }
  ]);
  const [hasUnseenNotif, setHasUnseenNotif] = useState(true);

  const [movieDetailModal, setMovieDetailModal] = useState(false);
  const [privateRoomModal, setPrivateRoomModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [predictModal, setPredictModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(9);
  const [predictionVal, setPredictionVal] = useState('');
  const [activePrivateCode, setActivePrivateCode] = useState(null);
  const [isEditingPrediction, setIsEditingPrediction] = useState(false);
  const [editingPredIndex, setEditingPredIndex] = useState(null);

  const [boardModal, setBoardModal] = useState(false);
  const [boardFee, setBoardFee] = useState(9);

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/Movies?select=*`, { method: 'GET', headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setMoviesList(data);
    } catch (err) {}
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/predictions?select=*`, { method: 'GET', headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setLeaderboardData(data);
    } catch (err) {}
  };

  useEffect(() => { fetchMovies(); fetchLeaderboard(); }, []);

  const handleSendOtp = () => {
    if (!userName.trim() || !phoneNumber || phoneNumber.length < 10) return alert('Enter valid Name and Phone.');
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    if (otp === '123456' || otp === '1234') {
      setIsLoggedIn(true);
      if (!hasAgreedDisclaimer) setShowDisclaimer(true);
    } else {
      alert('Invalid OTP. Use 1234');
    }
  };

  const handleCreatePrivateRoom = (movieTitle, fee, spots) => {
    const roomCode = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRoom = { code: roomCode, movie_title: movieTitle, entry_fee: fee, spots: spots, created_by: userName };
    setPrivateRooms(prev => [...prev, newRoom]);
    alert(`🎉 Private Room Created!\n\nRoom Code: ${roomCode}\nFee: ₹${fee}\nSpots: ${spots}`);
  };

  const handleJoinPrivateRoom = (roomDetails) => {
    setSelectedFee(roomDetails.entry_fee);
    setActivePrivateCode(roomDetails.code);
    setIsEditingPrediction(false);
    setPredictModal(true);
  };

  const handlePredictClick = async () => {
    if (!predictionVal || isNaN(predictionVal)) return alert('Enter valid prediction amount.');

    if (isEditingPrediction) {
      setLeaderboardData(prev => prev.map((p, idx) => idx === editingPredIndex ? { ...p, predicted_amount: parseFloat(predictionVal) } : p));
      setPredictModal(false);
      setPredictionVal('');
      setIsEditingPrediction(false);
      return alert('✅ Prediction Updated Successfully!');
    }

    if (walletBalance < selectedFee) return alert('Insufficient Wallet Balance!');

    setAdminWallet(prev => prev + (selectedFee * 0.20));

    const newEntry = { 
      movie_title: selectedMovie.title, 
      category: 'Day 1', 
      entry_fee: selectedFee,
      predicted_amount: parseFloat(predictionVal), 
      user_phone: `${userName} (${phoneNumber})`, 
      payment_status: 'SUCCESS',
      private_code: activePrivateCode || null
    };

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/predictions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(newEntry) });
    } catch (e) {}

    setWalletBalance(prev => prev - selectedFee);
    setLeaderboardData(prev => [newEntry, ...prev]);
    setPredictModal(false);
    setPredictionVal('');
    setActivePrivateCode(null);
    alert('🎉 Prediction Submitted Successfully!');
  };

  const handleDeclareWinner = async (targetMovie, actualCollection, fee = 9) => {
    if (!targetMovie || !actualCollection) return alert('Enter Movie Title & Collection.');
    const winnerKey = `${targetMovie.toLowerCase()}_${fee}`;

    if (winnersList[winnerKey]) {
      return alert(`⚠️ Winners ALREADY declared for ${targetMovie} (₹${fee} Contest). Duplicate money payout prevented.`);
    }

    const moviePredictions = leaderboardData.filter(p => {
      const titleMatch = p.movie_title?.toString().trim().toLowerCase() === targetMovie?.toString().trim().toLowerCase();
      const feeMatch = String(p.entry_fee) === String(fee) || (!p.entry_fee && Number(fee) === 9);
      return titleMatch && feeMatch;
    });

    if (moviePredictions.length === 0) return alert(`No predictions found for ${targetMovie} in ₹${fee} Contest.`);

    const actual = parseFloat(actualCollection);
    const sorted = moviePredictions.map(p => ({
      ...p,
      diff: Math.abs(parseFloat(p.predicted_amount) - actual)
    })).sort((a, b) => a.diff - b.diff);

    const stats = getContestStats(targetMovie, parseFloat(fee));
    const win1 = sorted[0];

    if (win1) {
      setWinnersList(prev => ({
        ...prev,
        [winnerKey]: { userName: win1.user_phone, prize: stats.rank1Prize, predictedAmount: win1.predicted_amount, actualCollection: actual }
      }));

      setWinnerLogs(prev => [
        { movieTitle: targetMovie, fee, winnerPhone: win1.user_phone, prize: stats.rank1Prize, actual },
        ...prev
      ]);

      if (win1.user_phone.includes(phoneNumber)) {
        setWalletBalance(p => p + stats.rank1Prize);
      }
    }

    alert(`🎉 WINNER DECLARED & PAID!\n\nWinner: ${win1.user_phone}\nPrize: ₹${stats.rank1Prize}`);
  };

  const handleSendNotification = (title, message) => {
    if (!title || !message) return alert('Enter title and message.');
    setNotifications(prev => [{ title, message, date: 'Just Now' }, ...prev]);
    setHasUnseenNotif(true);
    alert('📢 Broadcast Sent!');
  };

  const getContestStats = (movieTitle, fee) => {
    const movieEntries = leaderboardData.filter(p => {
      const titleMatch = p.movie_title?.toString().trim().toLowerCase() === movieTitle?.toString().trim().toLowerCase();
      const feeMatch = String(p.entry_fee) === String(fee) || (!p.entry_fee && Number(fee) === 9);
      return titleMatch && feeMatch;
    });

    const totalEntries = movieEntries.length;
    const totalCollected = totalEntries * Number(fee);
    const totalPrizePool = Math.round(totalCollected * 0.8);

    return {
      entriesCount: totalEntries,
      totalCollected,
      totalPrizePool,
      rank1Prize: Math.round(totalPrizePool * 0.5),
      movieEntries
    };
  };

  const filteredMovies = selectedCategory === 'ALL' ? moviesList : moviesList.filter(m => m.category?.toLowerCase() === selectedCategory.toLowerCase());
  const userJoinedMovies = moviesList.filter(movie => leaderboardData.some(p => p.movie_title?.toLowerCase() === movie.title?.toLowerCase() && p.user_phone?.includes(phoneNumber)));

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authLogo}>🎬 MCP Fantasy</Text>
          <Text style={styles.authSub}>Predict Box Office & Win Real Cash!</Text>
          {!otpSent ? (
            <View>
              <Text style={styles.label}>Name:</Text>
              <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Enter Name" placeholderTextColor="#666" />
              <Text style={styles.label}>Phone:</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} placeholder="10 Digit Phone" placeholderTextColor="#666" maxLength={10} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp}><Text style={styles.primaryBtnText}>Get OTP</Text></TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>OTP (1234):</Text>
              <TextInput style={styles.input} keyboardType="number-pad" value={otp} onChangeText={setOtp} placeholder="1234" placeholderTextColor="#666" />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp}><Text style={styles.primaryBtnText}>Verify OTP</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }
    return (
    <SafeAreaView style={styles.container}>
      <DisclaimerModal visible={showDisclaimer} onAgree={() => { setHasAgreedDisclaimer(true); setShowDisclaimer(false); }} />

      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>🎬 MCP Fantasy</Text>
          <Text style={{ color: '#aaa', fontSize: 10 }}>👤 {userName} {phoneNumber === ADMIN_PHONE ? '(Admin)' : ''}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: 10 }} onPress={() => setNotifModal(true)}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {hasUnseenNotif && <View style={{ position: 'absolute', right: 0, top: 0, width: 7, height: 7, borderRadius: 4, backgroundColor: '#e50914' }} />}
          </TouchableOpacity>
          <TouchableOpacity style={{ marginRight: 10 }} onPress={() => setSettingsModal(true)}>
            <Text style={{ fontSize: 18 }}>⚙️</Text>
          </TouchableOpacity>
     <TouchableOpacity onPress={() => setWalletModal(true)} style={styles.walletBadge}>
  <Text style={styles.walletText}>👛 ₹{walletBalance}</Text>
</TouchableOpacity>
     
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'contests' && styles.activeTab]} onPress={() => setActiveTab('contests')}><Text style={styles.tabText}>🔥 Contests</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'mycontests' && styles.activeTab]} onPress={() => setActiveTab('mycontests')}><Text style={styles.tabText}>🎯 My Contests</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'profile' && styles.activeTab]} onPress={() => setActiveTab('profile')}><Text style={styles.tabText}>👤 Profile</Text></TouchableOpacity>

      {phoneNumber === ADMIN_PHONE && (
          <TouchableOpacity style={[styles.tabItem, activeTab === 'admin' && styles.activeTab]} onPress={() => setActiveTab('admin')}><Text style={{ color: '#e50914', fontWeight: 'bold', fontSize: 11 }}>⚡ Admin</Text></TouchableOpacity>
        )}
      </View>

      {activeTab === 'contests' && (
        <View style={styles.listSection}>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            {['ALL', 'Bollywood', 'Hollywood', 'Tollywood'].map(cat => (
              <TouchableOpacity key={cat} style={[styles.filterChip, selectedCategory === cat && styles.activeFilterChip]} onPress={() => setSelectedCategory(cat)}>
                <Text style={{ color: '#fff', fontSize: 11 }}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredMovies}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>No Contests Active.</Text>}
            renderItem={({ item }) => {
              const locked = isContestLocked(item.release_date);
              const topWinner = winnersList[`${item.title?.toLowerCase()}_99`] || winnersList[`${item.title?.toLowerCase()}_49`] || winnersList[`${item.title?.toLowerCase()}_9`];
              const bannerUri = (item.banner && item.banner.startsWith('http')) ? item.banner : (item.banner?.startsWith('data:') ? item.banner : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500');

              return (
                <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => { setSelectedMovie(item); setMovieDetailModal(true); }}>
                  <View style={{ position: 'relative' }}>
                    <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
                    {topWinner && topWinner.actualCollection && (
                      <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#00ff87' }}>
                        <Text style={{ color: '#aaa', fontSize: 9, fontWeight: 'bold' }}>DAY 1 OFFICIAL</Text>
                        <Text style={{ color: '#00ff87', fontSize: 18, fontWeight: 'bold' }}>{topWinner.actualCollection} CR</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.movieTitle}>{item.title}</Text>
                      <TouchableOpacity 
                        style={{ backgroundColor: item.trailer_url ? '#e50914' : '#333', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 }}
                        onPress={() => item.trailer_url ? Linking.openURL(item.trailer_url) : alert('🎬 Trailer coming soon!')}
                      >
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>{item.trailer_url ? '▶ Trailer' : '⏳ No Trailer'}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>📅 Release Date: {item.release_date}</Text>

                    <View style={styles.actionRow}>
                      {topWinner ? (
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 11 }}>👑 Winner: {topWinner.userName}</Text>
                          <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 11 }}>💰 Prize: ₹{topWinner.prize}</Text>
                        </View>
                      ) : (
                        <View style={{ flex: 1, marginRight: 6 }}>
                          <Text style={{ color: '#00ff87', fontWeight: 'bold', fontSize: 11 }}>Status: Contests Active</Text>
                        </View>
                      )}

                      {locked ? (
                        <View style={styles.closedBtn}><Text style={{ color: '#aaa', fontSize: 11, fontWeight: 'bold' }}>🔒 Locked</Text></View>
                      ) : (
                        <View style={styles.predictBtn}><Text style={styles.predictBtnText}>View Contests ➔</Text></View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {activeTab === 'mycontests' && (
        <View style={styles.listSection}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>🎯 My Joined Contests</Text>
          <FlatList
            data={userJoinedMovies}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center', marginTop: 40 }}>You haven't joined any contest yet.</Text>}
            renderItem={({ item }) => {
              const locked = isContestLocked(item.release_date);
              const myPreds = leaderboardData.filter(p => p.movie_title?.toLowerCase() === item.title?.toLowerCase() && p.user_phone?.includes(phoneNumber));
              return (
                <View style={styles.card}>
                  <View style={{ padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>🎬 {item.title}</Text>
                    <Text style={{ color: '#00ff87', fontSize: 12, marginTop: 4 }}>My Predictions:</Text>
                    {myPreds.map((p, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, backgroundColor: '#222', padding: 6, borderRadius: 4 }}>
                        <Text style={{ color: '#ccc', fontSize: 11 }}>• Contest ₹{p.entry_fee || 9}: <Text style={{ color: '#00ff87', fontWeight: 'bold' }}>₹{p.predicted_amount} Cr</Text> {p.private_code ? `(Private: ${p.private_code})` : ''}</Text>
                        {!locked ? (
                          <TouchableOpacity style={{ backgroundColor: '#2196F3', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }} onPress={() => { setSelectedMovie(item); setSelectedFee(p.entry_fee || 9); setPredictionVal(String(p.predicted_amount)); setIsEditingPrediction(true); setEditingPredIndex(leaderboardData.indexOf(p)); setPredictModal(true); }}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✏️ Edit</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={{ color: '#777', fontSize: 9 }}>🔒 Locked</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            }}
          />
        </View>
      )}

      {activeTab === 'profile' && (
        <View style={styles.listSection}>
          <View style={styles.adminCard}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>👤 {userName}</Text>
            <Text style={{ color: '#aaa', fontSize: 12 }}>📞 +91 {phoneNumber}</Text>
            <View style={{ marginTop: 15, padding: 12, backgroundColor: '#222', borderRadius: 8 }}>
              <Text style={{ color: '#aaa', fontSize: 11 }}>Wallet Balance:</Text>
              <Text style={{ color: '#00ff87', fontSize: 24, fontWeight: 'bold' }}>₹{walletBalance}</Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'admin' && (
        <Admin 
          moviesList={moviesList}
          adminWallet={adminWallet}
          leaderboardData={leaderboardData}
          winnersList={winnersList}
          winnerLogs={winnerLogs}
          onPublish={async (t, c, r, l, b, tr) => {
            const newMovieObj = { title: t, category: c, release_date: r, lock_date: l, banner: b, trailer_url: tr, entry_fee: 9 };
            try { await fetch(`${SUPABASE_URL}/rest/v1/Movies`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(newMovieObj) }); } catch(e){}
            setMoviesList(prev => [newMovieObj, ...prev]);
          }}
          onWinner={handleDeclareWinner} 
          onAddWallet={(u, a) => setWalletBalance(p => p + parseFloat(a))}
          onAutoFetch={async (t) => {
            try {
              let res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=15d2ea6d0dc1d476efbca3eba219bbf0&query=${encodeURIComponent(t)}`);
              let data = await res.json();
              if (data?.results?.length > 0) return { title: data.results[0].title, release_date: data.results[0].release_date || '2026-10-10', banner: `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}` };
            } catch(e){}
            return null;
          }}
          onDeleteMovie={async (t) => {
            setMoviesList(prev => prev.filter(m => m.title !== t));
            try { await fetch(`${SUPABASE_URL}/rest/v1/Movies?title=eq.${encodeURIComponent(t)}`, { method: 'DELETE', headers: getHeaders() }); } catch(e){}
          }}
          onUpdateMovie={async (id, t, c, r, b, tr) => {
            setMoviesList(prev => prev.map(m => m.title === id ? { ...m, title: t, category: c, release_date: r, banner: b, trailer_url: tr } : m));
          }}
          onSendNotification={handleSendNotification}
        />
      )}

      <MovieDetailModal 
        visible={movieDetailModal} 
        onClose={() => setMovieDetailModal(false)}
        selectedMovie={selectedMovie}
        isContestLocked={isContestLocked}
        getContestStats={getContestStats}
        winnersList={winnersList}
        onOpenLeaderboard={(fee) => { setBoardFee(fee); setBoardModal(true); }}
        onOpenPredict={(fee) => { setSelectedFee(fee); setIsEditingPrediction(false); setPredictModal(true); }}
        onOpenPrivateRoom={() => { setMovieDetailModal(false); setPrivateRoomModal(true); }}
      />

      <PrivateRoomModal 
        visible={privateRoomModal}
        onClose={() => setPrivateRoomModal(false)}
        selectedMovie={selectedMovie}
        onCreateRoom={handleCreatePrivateRoom}
        onJoinRoom={handleJoinPrivateRoom}
        privateRooms={privateRooms}
        leaderboardData={leaderboardData}
        currentUserName={userName}
      />

      <PredictModal 
        visible={predictModal}
        onClose={() => setPredictModal(false)}
        selectedMovie={selectedMovie}
        selectedFee={selectedFee}
        predictionVal={predictionVal}
        setPredictionVal={setPredictionVal}
        onSubmit={handlePredictClick}
        isEditing={isEditingPrediction}
      />
<WalletModal
  visible={walletModal}
  onClose={() => setWalletModal(false)}
  walletBalance={walletBalance}
  onRequestDeposit={(data) => {
    console.log('Deposit Request:', data);
    // Yahan aap Supabase/Backend request bhej sakte hain
  }}
  onRequestWithdraw={(data) => {
    console.log('Withdrawal Request:', data);
    // Yahan aap Supabase/Backend request bhej sakte hain
  }}
/>

      <LeaderboardModal 
        visible={boardModal}
        onClose={() => setBoardModal(false)}
        selectedMovie={selectedMovie}
        boardFee={boardFee}
        getContestStats={getContestStats}
        winnersList={winnersList}
      />

      <NotificationsModal 
        visible={notifModal}
        onClose={() => setNotifModal(false)}
        notifications={notifications}
        onMarkSeen={() => setHasUnseenNotif(false)}
      />

      <SettingsModal 
        visible={settingsModal}
        onClose={() => setSettingsModal(false)}
      />
    </SafeAreaView>
  );
}
