'use client';

import * as React from 'react';
import { XLogo, LinkSimple } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { Button } from '#/components/ui/button';
import { formatCount } from '#/lib/format';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';

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
  /** Bio text */
  bio?: string;
  /** Social links */
  socialLinks?: SocialLink[];
  /** Follower count */
  followers?: number;
  /** Subscriber count */
  subscribers?: number;
  /** Follow button handler */
  onFollow?: () => void;
  /** Subscribe button handler */
  onSubscribe?: () => void;
  /** Whether the current user is following this profile */
  isFollowing?: boolean;
}

function ProfileHero({
  className,
  bannerUrl,
  avatarUrl,
  initials,
  name,
  handle,
  verified,
  bio,
  socialLinks,
  followers,
  subscribers,
  onFollow,
  onSubscribe,
  isFollowing,
  ...props
}: ProfileHeroProps) {
  return (
    <div
      data-slot="profile-hero"
      className={cn('relative mx-auto w-full max-w-[1144px] px-4', className)}
      {...props}
    >
      {/* Banner with golden ambient glow */}
      <div className="relative">
        {/* Golden ambient glow — bleeds beneath the banner */}
        <div
          className="pointer-events-none absolute -inset-x-20 -bottom-24 top-1/3 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 50% 70%, rgba(180, 130, 40, 0.30) 0%, rgba(160, 100, 20, 0.10) 45%, transparent 75%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Tighter hot-edge glow along the bottom */}
        <div
          className="pointer-events-none absolute -inset-x-8 -bottom-12 top-1/2 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 85%, rgba(200, 150, 50, 0.25) 0%, transparent 60%)',
            filter: 'blur(50px)',
          }}
        />

        <div className="relative h-[180px] w-full overflow-hidden rounded-lg bg-grey-300 sm:h-[220px]">
          {bannerUrl && (
            <img src={bannerUrl} alt="" className="size-full object-cover" />
          )}
        </div>
      </div>

      {/* Profile content — avatar overlaps banner bottom */}
      <div className="relative">
        {/* Avatar — overlaps the banner by half */}
        <div className="-mt-[82px] mb-4">
          <Avatar size="xxl" borderColor="default">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initials ?? name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Main Content: info left, actions right */}
        <div className="flex items-start justify-between gap-4">
          {/* Profile Info */}
          <div className="flex flex-col gap-5">
            {/* Name + handle + bio + followers */}
            <div className="flex flex-col gap-3">
              {/* Name + handle */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-[28px] font-bold leading-normal text-foreground">
                    {name}
                  </h1>
                  {verified && <VerifiedBadge className="size-8" />}
                </div>
                {handle && (
                  <p className="text-xs leading-6 text-foreground opacity-50">@{handle}</p>
                )}
              </div>

              {/* Bio */}
              {bio && (
                <p className="max-w-[509px] font-serif text-sm leading-[18px] text-foreground">
                  {bio}
                </p>
              )}

              {/* Follower / Subscriber counts */}
              {(followers !== undefined || subscribers !== undefined) && (
                <div className="flex items-baseline gap-8 leading-6 text-foreground">
                  {followers !== undefined && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium tracking-tight">
                        {formatCount(followers)}
                      </span>
                      <span className="text-xs opacity-50">Followers</span>
                    </div>
                  )}
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
                      <XLogo weight="regular" className="size-6" />
                    ) : (
                      <LinkSimple weight="regular" className="size-6" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(onFollow || onSubscribe) && (
            <div className="flex shrink-0 items-start gap-4">
              {onFollow && (
                <Button variant="outline" onClick={onFollow} className="w-[130px]">
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              {onSubscribe && <Button onClick={onSubscribe}>Subscribe</Button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { ProfileHero, type ProfileHeroProps };
