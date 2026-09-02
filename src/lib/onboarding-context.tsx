import { createContext, useContext, useMemo, useState } from 'react';

import { DEFAULT_AVATAR_KEY } from '@/lib/avatars';
import type { Gender } from '@/lib/types';

export interface OnboardingDraft {
  username: string;
  gender: Gender | null;
  displayName: string;
  avatarKey: string;
  focusTimerEnabled: boolean;
  moodTrackingEnabled: boolean;
  periodTrackingEnabled: boolean;
  periodLastStart: string | null;
  periodCycleLength: number;
}

interface OnboardingContextValue {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}

const defaultDraft: OnboardingDraft = {
  username: '',
  gender: null,
  displayName: '',
  avatarKey: DEFAULT_AVATAR_KEY,
  focusTimerEnabled: true,
  moodTrackingEnabled: false,
  periodTrackingEnabled: false,
  periodLastStart: null,
  periodCycleLength: 28,
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      draft,
      update: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
    }),
    [draft]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
