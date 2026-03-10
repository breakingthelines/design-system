'use client';

import * as React from 'react';
import { XLogo, LinkSimple } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { formatCount } from '#/lib/format';
import { Avatar, AvatarImage, AvatarFallback } from '#/components/ui/avatar';
import { VerifiedBadge } from '#/components/ui/verified-badge';
import { Button } from '#/components/ui/button';

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
    <div data-slot="profile-hero" className={cn('relative w-full', className)} {...props}>
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-grey-300 sm:h-56 lg:h-64">
        {bannerUrl && <img src={bannerUrl} alt="" className="size-full object-cover" />}
      </div>

      {/* Content */}
      <div className="relative px-4 sm:px-6 lg:px-8">
        {/* Avatar - overlapping the banner */}
        <div className="-mt-20 mb-4">
          <Avatar size="xxl" borderColor="default">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initials ?? name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Name + Actions row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            {/* Name + Verified */}
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-foreground">{name}</h1>
              {verified && <VerifiedBadge />}
            </div>
            {/* Handle */}
            {handle && <p className="text-sm text-muted-foreground">@{handle}</p>}
          </div>

          {/* Actions */}
          {(onFollow || onSubscribe) && (
            <div className="flex items-center gap-2">
              {onFollow && (
                <Button variant={isFollowing ? 'outline' : 'ghost'} size="sm" onClick={onFollow}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              )}
              {onSubscribe && (
                <Button size="sm" onClick={onSubscribe}>
                  Subscribe
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{bio}</p>
        )}

        {/* Social links */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            {socialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={link.label ?? link.type}
              >
                {link.type === 'x' ? (
                  <XLogo weight="regular" className="size-4" />
                ) : (
                  <LinkSimple weight="regular" className="size-4" />
                )}
              </a>
            ))}
          </div>
        )}

        {/* Stats */}
        {(followers !== undefined || subscribers !== undefined) && (
          <div className="mt-4 flex items-center gap-4">
            {followers !== undefined && (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">{formatCount(followers)}</span>
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
            )}
            {subscribers !== undefined && (
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">
                  {formatCount(subscribers)}
                </span>
                <span className="text-xs text-muted-foreground">Subscribers</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export { ProfileHero, type ProfileHeroProps };
