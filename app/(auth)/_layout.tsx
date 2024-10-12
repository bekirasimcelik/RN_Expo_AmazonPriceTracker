import { Redirect, Slot } from 'expo-router';
import { useAuth } from '~/context/AuthContext';

export default function () {
  const { user } = useAuth();

  if (user) {
    return <Redirect href="/" />;
  }
  return <Slot />;
}
