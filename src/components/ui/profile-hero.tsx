'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
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

import { cn } from '#/lib/utils';
import { Button } from '#/components/ui/button';
import { formatCount } from '#/lib/format';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { AmbientEmitter } from '#/components/ui/ambient-emitter';
import { BtlPlaceholder } from '#/components/ui/btl-placeholder';
import { Image } from '#/components/ui/image';
import { Badge } from '#/components/ui/badge';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { useTilt } from '#/hooks/use-tilt';

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

export interface SocialLink {
  type: SocialLinkType;
  url: string;
  label?: string;
}

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
 * Resolve the icon for a social link.
 *
 * Links arrive from the profile API, which stores the platform enum without
 * constraining it, so a value outside the union can reach render at runtime.
 * The lookup is therefore treated as partial and anything unrecognised (or
 * unspecified) falls back to the globe rather than rendering nothing.
 *
 * Exported so surfaces that render social links outside this component (the
 * profile About tab, for one) resolve the same icon instead of keeping their
 * own copy of the decision.
 */
export function socialLinkIcon(type: SocialLinkType): Icon {
  return (SOCIAL_LINK_ICONS as Partial<Record<SocialLinkType, Icon>>)[type] ?? Globe;
}

interface ProfileHeroProps extends React.ComponentProps<'div'> {
  /** Banner/cover image URL */
  bannerUrl?: string;
  /** Profile avatar URL */
  avatarUrl?: string;
  /** Fallback initials */
  initials?: string;
  /** Display name */
  name: string;
  /** Handle (without @) */
  handle?: string;
  /** Verified status */
  verified?: boolean;
  /** Subscription tier (normalized: "PRO", "LINE_BREAKERS", "FREE", etc.) */
  tier?: string;
  /** Short one-liner tagline displayed under name */
  description?: string;
  /** Social links */
  socialLinks?: SocialLink[];
  /** Follower count */
  followers?: number;
  /** Following count */
  following?: number;
  /** Subscriber count */
  subscribers?: number;
  /** Member count — the squad analogue of the follower / subscriber counts */
  memberCount?: number;
  /** Follow button handler */
  onFollow?: () => void;
  /** Subscribe button handler */
  onSubscribe?: () => void;
  /** Whether the current user already has an active principal subscription */
  isSubscribed?: boolean;
  /** Whether the current user is following this profile */
  isFollowing?: boolean;
  /** Click handler for followers count */
  onFollowersClick?: () => void;
  /** Click handler for following count */
  onFollowingClick?: () => void;
  /** Click handler for the member count (squads) */
  onMemberCountClick?: () => void;
}

function ProfileHero({
  className,
  bannerUrl,
  avatarUrl,
  initials,
  name,
  handle,
  verified,
  tier,
  description,
  socialLinks,
  followers,
  following,
  subscribers,
  memberCount,
  onFollow,
  onSubscribe,
  isSubscribed,
  isFollowing,
  onFollowersClick,
  onFollowingClick,
  onMemberCountClick,
  ...props
}: ProfileHeroProps) {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(4);

  return (
    <div
      data-slot="profile-hero"
      className={cn('relative mx-auto w-full max-w-[1144px] overflow-visible px-4', className)}
      {...props}
    >
      {/* Banner with ambient glow */}
      <div className="relative">
        <div className="pointer-events-none absolute -inset-x-8 -top-12 -bottom-14 sm:-inset-x-10 sm:-top-16 sm:-bottom-16">
          <AmbientEmitter
            src={bannerUrl}
            color={bannerUrl ? undefined : 'rgb(141, 32, 32)'}
            size="md"
            position="center"
            scale={1.35}
            opacity={0.34}
          />
        </div>

        {/* Banner image with 3D tilt */}
        <motion.div
          className="relative z-10 h-[180px] w-full overflow-hidden rounded-lg bg-grey-300 sm:h-[220px]"
          style={{
            rotateX,
            rotateY,
            transformPerspective: 800,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          <Image
            src={bannerUrl}
            alt=""
            loading="eager"
            className="size-full"
            fallback={<BtlPlaceholder className="rounded-[inherit]" framed={false} />}
          />
        </motion.div>
      </div>

      {/* Profile content — avatar overlaps banner bottom */}
      <div className="relative z-20">
        {/* Avatar — overlaps the banner by half */}
        <div className="-mt-12 mb-4 sm:-mt-[82px]">
          <Avatar size="xxl" borderColor="default" className="!size-[100px] sm:!size-[164px]">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback branded>{initials ?? name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Main Content: stacked on mobile, side-by-side on desktop */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Profile Info */}
          <div className="flex flex-col gap-5">
            {/* Name + handle + bio + followers */}
            <div className="flex flex-col gap-3">
              {/* Name + handle */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-bold leading-normal text-foreground sm:text-[28px]">
                    {name}
                  </h1>
                  {verified && <VerifiedBadge className="size-6 sm:size-8" />}
                  {tier === 'PRO' && (
                    <Badge variant="secondary" className="text-[10px]">
                      Pro
                    </Badge>
                  )}
                  {tier === 'LINE_BREAKERS' && (
                    <Badge variant="tintedBrand" className="text-[10px]">
                      Line Breaker
                    </Badge>
                  )}
                </div>
                {handle && (
                  <p className="text-xs leading-6 text-foreground opacity-50">@{handle}</p>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="max-w-[509px] font-serif text-sm leading-[18px] text-foreground">
                  {description}
                </p>
              )}

              {/* Member / Follower / Following / Subscriber counts */}
              {(memberCount !== undefined ||
                followers !== undefined ||
                following !== undefined ||
                subscribers !== undefined) && (
                <div className="flex items-baseline gap-8 leading-6 text-foreground">
                  {memberCount !== undefined &&
                    (onMemberCountClick ? (
                      <button
                        type="button"
                        onClick={onMemberCountClick}
                        className="flex cursor-pointer items-baseline gap-2 transition-opacity hover:opacity-70"
                      >
                        <span className="text-sm font-medium tracking-tight">
                          {formatCount(memberCount)}
                        </span>
                        <span className="text-xs opacity-50">
                          {memberCount === 1 ? 'Member' : 'Members'}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium tracking-tight">
                          {formatCount(memberCount)}
                        </span>
                        <span className="text-xs opacity-50">
                          {memberCount === 1 ? 'Member' : 'Members'}
                        </span>
                      </div>
                    ))}
                  {followers !== undefined &&
                    (onFollowersClick ? (
                      <button
                        type="button"
                        onClick={onFollowersClick}
                        className="flex cursor-pointer items-baseline gap-2 transition-opacity hover:opacity-70"
                      >
                        <span className="text-sm font-medium tracking-tight">
                          {formatCount(followers)}
                        </span>
                        <span className="text-xs opacity-50">Followers</span>
                      </button>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium tracking-tight">
                          {formatCount(followers)}
                        </span>
                        <span className="text-xs opacity-50">Followers</span>
                      </div>
                    ))}
                  {following !== undefined &&
                    (onFollowingClick ? (
                      <button
                        type="button"
                        onClick={onFollowingClick}
                        className="flex cursor-pointer items-baseline gap-2 transition-opacity hover:opacity-70"
                      >
                        <span className="text-sm font-medium tracking-tight">
                          {formatCount(following)}
                        </span>
                        <span className="text-xs opacity-50">Following</span>
                      </button>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium tracking-tight">
                          {formatCount(following)}
                        </span>
                        <span className="text-xs opacity-50">Following</span>
                      </div>
                    ))}
                  {subscribers !== undefined && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium tracking-tight">
                        {formatCount(subscribers)}
                      </span>
                      <span className="text-xs opacity-50">Subscribers</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Social links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex items-center gap-5">
                {socialLinks.map((link) => {
                  const SocialIcon = socialLinkIcon(link.type);
                  return (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-slot="profile-hero-social-link"
                      data-platform={link.type}
                      className="text-red-100 transition-opacity hover:opacity-80"
                      aria-label={link.label ?? link.type}
                    >
                      <SocialIcon weight="regular" className="size-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onFollow || onSubscribe) && (
            <div className="flex shrink-0 items-start gap-3">
              {onFollow && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onFollow}
                  className="flex-1 sm:w-[130px] sm:flex-none rounded-[4px] bg-grey-200 border-grey-300 backdrop-blur-[15px] hover:bg-grey-200 hover:border-[#807c7c]"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              {onSubscribe && (
                <Button
                  variant={isSubscribed ? 'outline' : 'default'}
                  size="lg"
                  onClick={onSubscribe}
                  className="flex-1 sm:w-[130px] sm:flex-none"
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ProfileHero, type ProfileHeroProps };
