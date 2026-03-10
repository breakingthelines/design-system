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
      className={cn('relative flex w-full flex-col gap-8', className)}
      {...props}
    >
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-grey-300 sm:h-56 lg:h-64">
        {bannerUrl && <img src={bannerUrl} alt="" className="size-full object-cover" />}
      </div>

      {/* Profile Content Container */}
      <div className="relative px-4 sm:px-6 lg:px-8">
        {/* Avatar - overlapping the banner */}
        <div className="-mt-[calc(82px+2rem)] mb-6">
          <Avatar size="xxl" borderColor="default">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initials ?? name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Main Content: info left, actions right */}
        <div className="flex items-start justify-between">
          {/* Profile Info Container */}
          <div className="flex flex-col gap-6">
            {/* Profile section: user info + bio + followers */}
            <div className="flex flex-col gap-4">
              {/* Profile Info: user identity + bio */}
              <div className="flex flex-col gap-4">
                {/* User Info: name + handle */}
                <div className="flex flex-col gap-2">
                  {/* User Name Container */}
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-[28px] font-bold leading-normal text-foreground">
                      {name}
                    </h1>
                    {verified && <VerifiedBadge className="size-8" />}
                  </div>
                  {/* Handle */}
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
              </div>
              {/* Follower / Subscriber Container */}
              {(followers !== undefined || subscribers !== undefined) && (
                <div className="flex items-start gap-8 leading-6 text-foreground">
                  {followers !== undefined && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium tracking-tight">
                        {formatCount(followers)}
                      </span>
                      <span className="text-xs opacity-50">Followers</span>
                    </div>
                  )}
                  {subscribers !== undefined && (
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium tracking-tight">
                        {formatCount(subscribers)}
                      </span>
                      <span className="text-xs opacity-50">Subscribers</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Social Media Links */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex items-start gap-5">
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
                <Button
                  variant="outline"
                  onClick={onFollow}
                  className="w-[130px]"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              {onSubscribe && (
                <Button onClick={onSubscribe}>
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
