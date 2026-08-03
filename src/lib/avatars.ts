import type { ImageSourcePropType } from 'react-native';

export const AVATAR_IMAGES: Record<string, ImageSourcePropType> = {
  cat1: require('../../images/profiles/cat1.png'),
  cat2: require('../../images/profiles/cat2.png'),
  batman: require('../../images/profiles/batman.png'),
  batwomen: require('../../images/profiles/batwomen.png'),
  luffy: require('../../images/profiles/luffy.png'),
  zoro: require('../../images/profiles/zoro.png'),
  nami: require('../../images/profiles/nami.png'),
  sanji: require('../../images/profiles/sanji.png'),
  gwen: require('../../images/profiles/gwen.png'),
  miles: require('../../images/profiles/miles.png'),
};

export const AVATAR_KEYS = Object.keys(AVATAR_IMAGES);

export const DEFAULT_AVATAR_KEY = 'batman';

/** `key` comes from the `profiles.avatar_emoji` column — a legacy name that now stores one of AVATAR_KEYS, not a literal emoji. */
export function avatarSource(key: string | null | undefined): ImageSourcePropType {
  return (key && AVATAR_IMAGES[key]) || AVATAR_IMAGES[DEFAULT_AVATAR_KEY];
}
