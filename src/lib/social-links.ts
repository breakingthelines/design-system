import {
  Butterfly,
  Globe,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
  type Icon,
} from '@phosphor-icons/react';

/**
 * Social platforms a profile can display a link for.
 *
 * The named members mirror the picker studio offers plus LinkedIn, so the
 * compose and read surfaces agree on which logo represents a platform.
 * `website` is the catch-all for a generic external link and renders a globe.
 */
export type SocialLinkType =
  | 'x'
  | 'bluesky'
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'website';

/** Logo per social link type. Keep in step with studio's `SOCIAL_OPTIONS`. */
const SOCIAL_LINK_ICONS: Record<SocialLinkType, Icon> = {
  x: XLogo,
  bluesky: Butterfly,
  youtube: YoutubeLogo,
  instagram: InstagramLogo,
  tiktok: TiktokLogo,
  linkedin: LinkedinLogo,
  website: Globe,
};

/**
 * Hosts that identify a platform.
 *
 * Matching is on the parsed host, never on a substring of the raw URL: a
 * substring test makes `notyoutube.com` a YouTube link and turns any path
 * containing the word "instagram" into an Instagram profile. A leading `www.`
 * is optional; every other host — including deeper subdomains such as
 * `m.youtube.com` or `uk.linkedin.com` — is not claimed, and degrades to the
 * stored platform and then the globe rather than being guessed at.
 */
const HOSTS_BY_TYPE: ReadonlyArray<readonly [SocialLinkType, readonly string[]]> = [
  ['x', ['x.com', 'twitter.com']],
  ['bluesky', ['bsky.app']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['instagram', ['instagram.com']],
  ['tiktok', ['tiktok.com']],
  ['linkedin', ['linkedin.com']],
];

/**
 * Parse a stored social link into a URL, or `undefined` if it is not one.
 *
 * Stored links are free text — user-service accepts whatever the client sends —
 * so a value can be a bare handle (`@name`), a relative path, or plain
 * nonsense. A scheme-less host (`x.com/foo`) is upgraded to https because that
 * is how people type a profile address; a value that starts with `@` or `/` is
 * not a host and is rejected rather than being mangled into one. Anything that
 * still fails to parse, or resolves to a non-http(s) scheme or a host without a
 * dot, returns `undefined` instead of throwing.
 */
function parseLinkUrl(raw: string | undefined | null): URL | undefined {
  const value = raw?.trim();
  if (!value) return undefined;

  const candidate = /^https?:\/\//i.test(value)
    ? value
    : value.startsWith('//')
      ? `https:${value}`
      : // bare handles ("@name") and paths ("/name") are not external profiles
        /^[@/]/.test(value)
        ? ''
        : `https://${value}`;
  if (!candidate) return undefined;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    if (!url.hostname.includes('.')) return undefined;
    return url;
  } catch {
    return undefined;
  }
}

/** Match a parsed host against the platform table, `www.` optional. */
function matchHost(parsed: URL): SocialLinkType | undefined {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  for (const [type, hosts] of HOSTS_BY_TYPE) {
    if (hosts.includes(host)) return type;
  }
  return undefined;
}

/**
 * Derive the platform a link points at from its URL, or `undefined` when the
 * host is not one we recognise (or the value is not a usable URL at all).
 */
export function socialLinkTypeFromUrl(url: string | undefined | null): SocialLinkType | undefined {
  const parsed = parseLinkUrl(url);
  return parsed ? matchHost(parsed) : undefined;
}

/**
 * Resolve the platform for a social link, URL first.
 *
 * The stored platform is not trustworthy. user-service persists the enum
 * without validating it and blind-casts it back on read, so any client can put
 * any value on any row — and historically most do: the great majority of
 * stored links claim X regardless of where they point. The URL is the fact, so
 * it wins.
 *
 * Precedence:
 *
 * 1. A readable URL decides, and it decides both ways. A known host gives that
 *    platform; a readable URL on *any other* host resolves to `website`, not to
 *    the stored platform — if the link were X it would be on `x.com`, so a row
 *    claiming X while pointing at `pinterest.com` is provably wrong and the
 *    globe is the honest icon. This is what makes an unsupported platform
 *    (Pinterest, Facebook, Reddit) degrade correctly instead of inheriting a
 *    junk enum.
 * 2. The stored platform is consulted only when nothing can be read from the
 *    value at all — a bare handle like `@name`, or empty/garbage input — where
 *    it is the single remaining signal.
 * 3. The globe when neither resolves.
 */
export function resolveSocialLinkType(
  url: string | undefined | null,
  storedType?: SocialLinkType
): SocialLinkType {
  const parsed = parseLinkUrl(url);
  if (parsed) return matchHost(parsed) ?? 'website';
  if (storedType && storedType in SOCIAL_LINK_ICONS) return storedType;
  return 'website';
}

/**
 * Resolve the icon for an already-known platform.
 *
 * The lookup is treated as partial: a value outside the union can reach render
 * because the profile API does not constrain what it stores, and it falls back
 * to the globe rather than rendering nothing.
 *
 * Prefer {@link resolveSocialLinkIcon} when a URL is available — it does not
 * trust the stored platform.
 */
export function socialLinkIcon(type: SocialLinkType): Icon {
  return (SOCIAL_LINK_ICONS as Partial<Record<SocialLinkType, Icon>>)[type] ?? Globe;
}

/**
 * Resolve the icon for a social link from its URL, falling back to the stored
 * platform and then the globe. This is the resolver render surfaces should use.
 */
export function resolveSocialLinkIcon(
  url: string | undefined | null,
  storedType?: SocialLinkType
): Icon {
  return socialLinkIcon(resolveSocialLinkType(url, storedType));
}
