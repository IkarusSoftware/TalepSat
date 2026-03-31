// Geliştirme sırasında bilgisayarının IP adresini veya localhost kullan
// Expo Go için: bilgisayarının yerel IP adresi (örn: http://192.168.1.x:3001)
// Android Emülatör için: http://10.0.2.2:3001
// iOS Simulator için: http://localhost:3001

import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();

export const API_URL = debuggerHost
  ? `http://${debuggerHost}:3000`
  : 'http://10.0.2.2:3000'; // Android emülatör fallback
