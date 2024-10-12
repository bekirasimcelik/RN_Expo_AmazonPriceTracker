import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, Text } from 'react-native';

import { supabase } from '~/utils/supabase';

export default function Modal() {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/(auth)/login');
    } else {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <>
      <Text onPress={handleSignOut}>Sign Out</Text>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
