import { registerRootComponent } from 'expo';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

// App ko safe tarike se load karo: koi bhi error aaye to app band hone ki jagah
// screen par error likha aayega (screenshot lekar bhej sakte ho).
let App = null;
let loadError = null;
try {
  App = require('./App').default;
} catch (e) {
  loadError = e;
}

let showGlobalError = null;
let pendingError = null;
try {
  if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      const msg = String((error && (error.stack || error.message)) || error);
      if (!isFatal) return;
      if (showGlobalError) showGlobalError(msg);
      else pendingError = msg;
    });
  }
} catch (e) {}

function ErrorScreen({ message, onRetry }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 20 }}>
      <Text style={{ color: '#ff4d4d', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>⚠️ App Error</Text>
      <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 10 }}>Is screen ka screenshot lekar bhej do.</Text>
      <ScrollView style={{ flex: 1, backgroundColor: '#111', borderRadius: 8, padding: 10 }}>
        <Text selectable style={{ color: '#fff', fontSize: 11 }}>{message}</Text>
      </ScrollView>
      {onRetry ? (
        <TouchableOpacity onPress={onRetry} style={{ backgroundColor: '#e50914', padding: 14, borderRadius: 8, marginTop: 12 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(e) {
    return { err: e };
  }
  render() {
    if (this.state.err) {
      const e = this.state.err;
      return <ErrorScreen message={String((e && (e.stack || e.message)) || e)} onRetry={() => this.setState({ err: null })} />;
    }
    return this.props.children;
  }
}

function Root() {
  const [globalErr, setGlobalErr] = React.useState(pendingError);
  React.useEffect(() => {
    showGlobalError = setGlobalErr;
    return () => { showGlobalError = null; };
  }, []);

  if (loadError) return <ErrorScreen message={String(loadError.stack || loadError)} />;
  if (globalErr) return <ErrorScreen message={globalErr} onRetry={() => setGlobalErr(null)} />;
  return (
    <Boundary>
      <App />
    </Boundary>
  );
}

registerRootComponent(Root);
