import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
    authContainer: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center', padding: 20 },
      authCard: { width: '100%', backgroundColor: '#1a1a1a', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
        authLogo: { fontSize: 24, fontWeight: 'bold', color: '#e50914', textAlign: 'center' },
          authSub: { fontSize: 11, color: '#aaa', textAlign: 'center', marginBottom: 20 },
            header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#181818', borderBottomWidth: 1, borderBottomColor: '#262626' },
              logoText: { fontSize: 18, fontWeight: 'bold', color: '#e50914' },
                walletBadge: { backgroundColor: '#222', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 15, borderWidth: 1, borderColor: '#00ff87' },
                  walletText: { color: '#00ff87', fontWeight: 'bold', fontSize: 12 },
                    tabBar: { flexDirection: 'row', backgroundColor: '#141414', borderBottomWidth: 1, borderBottomColor: '#262626' },
                      tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center' },
                        activeTab: { borderBottomWidth: 2, borderBottomColor: '#e50914' },
                          tabText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
                            listSection: { flex: 1, padding: 10 },
                              filterChip: { backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 6, marginBottom: 6 },
                                activeFilterChip: { backgroundColor: '#e50914' },
                                  card: { backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#282828' },
                                    bannerImage: { width: '100%', height: 160, backgroundColor: '#222' },
                                      cardDetails: { padding: 12 },
                                        movieTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
                                          catBadge: { color: '#00ff87', fontSize: 10, fontWeight: 'bold', backgroundColor: '#122e1e', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
                                            actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
                                              predictBtn: { backgroundColor: '#e50914', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
                                                predictBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
                                                  closedBtn: { backgroundColor: '#333', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
                                                    adminCard: { backgroundColor: '#181818', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#282828' },
                                                      adminHead: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
                                                        input: { backgroundColor: '#222', color: '#fff', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#333', fontSize: 12 },
                                                          label: { color: '#aaa', fontSize: 11, marginBottom: 4 },
                                                            primaryBtn: { backgroundColor: '#e50914', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
                                                              primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
                                                                modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 15 },
                                                                  modalCard: { width: '100%', maxHeight: '85%', backgroundColor: '#181818', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
                                                                    modalTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
                                                                      topOverlayBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 15, zIndex: 99999 }
                                                                      });
                                                                      