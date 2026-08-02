import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { session, profile } = useAuth();

  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!profile?.onboarding_completed) return <Redirect href="/(onboarding)/username" />;
  return <Redirect href="/(tabs)" />;
}
