'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { XLogo, LinkSimple } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Button } from '#/components/ui/button';
import { formatCount } from '#/lib/format';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { AmbientEmitter } from '#/components/ui/ambient-emitter';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { useTilt } from '#/hooks/use-tilt';

export interface SocialLink {
  type: 'x' | 'bluesky' | 'website';
  url: string;
  label?: string;
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
  /** Follow button handler */
  onFollow?: () => void;
  /** Subscribe button handler */
  onSubscribe?: () => void;
  /** Whether the current user is following this profile */
  isFollowing?: boolean;
  /** Click handler for followers count */
  onFollowersClick?: () => void;
  /** Click handler for following count */
  onFollowingClick?: () => void;
}

function ProfileHero({
  className,
  bannerUrl,
  avatarUrl,
  initials,
  name,
  handle,
  verified,
  description,
  socialLinks,
  followers,
  following,
  subscribers,
  onFollow,
  onSubscribe,
  isFollowing,
  onFollowersClick,
  onFollowingClick,
  ...props
}: ProfileHeroProps) {
  const { rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt(4);

  return (
    <div
      data-slot="profile-hero"
      className={cn('relative mx-auto w-full max-w-[1144px] px-4', className)}
      {...props}
    >
      {/* Banner with ambient glow */}
      <div className="relative overflow-hidden">
        {bannerUrl && <AmbientEmitter src={bannerUrl} size="md" position="center" scale={1.3} />}

        {/* Banner image with 3D tilt */}
        <motion.div
          className="relative h-[180px] w-full overflow-hidden rounded-lg bg-grey-300 sm:h-[220px]"
          style={{
            rotateX,
            rotateY,
            transformPerspective: 800,
            transformStyle: 'preserve-3d',
          }}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
        >
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="size-full object-cover" />
          ) : (
            <div
              className="size-full"
              style={{
                background:
                  'radial-gradient(ellipse 80% 70% at 70% 40%, rgba(229, 51, 42, 0.15) 0%, transparent 70%), ' +
                  'radial-gradient(ellipse 60% 50% at 30% 60%, rgba(226, 6, 19, 0.10) 0%, transparent 60%)',
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Profile content — avatar overlaps banner bottom */}
      <div className="relative">
        {/* Avatar — overlaps the banner by half */}
        <div className="-mt-12 mb-4 sm:-mt-[82px]">
          <Avatar size="xxl" borderColor="default" className="!size-[100px] sm:!size-[164px]">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initials ?? name.charAt(0)}</AvatarFallback>
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

              {/* Follower / Following / Subscriber counts */}
              {(followers !== undefined ||
                following !== undefined ||
                subscribers !== undefined) && (
                <div className="flex items-baseline gap-8 leading-6 text-foreground">
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
                {socialLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-100 transition-opacity hover:opacity-80"
                    aria-label={link.label ?? link.type}
                  >
                    {link.type === 'x' ? (
                      <XLogo weight="regular" className="size-5" />
                    ) : (
                      <LinkSimple weight="regular" className="size-5" />
                    )}
                  </a>
                ))}
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
                  className="flex-1 sm:w-[130px] sm:flex-none rounded-[2px] bg-grey-200 border-grey-300 backdrop-blur-[15px] hover:bg-grey-200 hover:border-[#807c7c]"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              {onSubscribe && (
                <Button
                  size="lg"
                  onClick={onSubscribe}
                  className="flex-1 sm:w-[130px] sm:flex-none"
                >
                  Subscribe
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
