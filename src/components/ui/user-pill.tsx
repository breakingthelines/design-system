'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { SquadRoleBadge } from './squad-role-badge';
import { IconButton } from './icon-button';

export type UserPillStatus = 'active' | 'typing' | 'idle' | 'away';

export interface UserPillUser {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
  role?: string;
}

export interface UserPillProps extends React.HTMLAttributes<HTMLDivElement> {
  user: UserPillUser;
  cursorColor: string;
  status?: UserPillStatus;
  /** When viewing this user's edits */
  isContributionFocus?: boolean;
  /** Exit contribution focus callback */
  onClose?: () => void;
}

function TypingIndicator() {
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <span className="animate-typing-dot size-1 rounded-full bg-current" />
      <span className="animate-typing-dot size-1 rounded-full bg-current" />
      <span className="animate-typing-dot size-1 rounded-full bg-current" />
    </span>
  );
}

function UserPill({
  user,
  cursorColor,
  status = 'active',
  isContributionFocus = false,
  onClose,
  onClick,
  className,
  ...props
}: UserPillProps) {
  const statusOpacity = {
    active: 'opacity-100',
    typing: 'opacity-100',
    idle: 'opacity-60',
    away: 'opacity-40',
  };

  const getStatusContent = () => {
    if (status === 'typing') {
      return <TypingIndicator />;
    }
    if (status === 'away') {
      return <span className="text-[10px] text-muted-foreground">Away</span>;
    }
    if (user.role) {
      return <SquadRoleBadge role={user.role} size="sm" />;
    }
    return null;
  };

  return (
    <motion.div
      whileHover={onClick ? motionTokens.presets.userPill.hover : undefined}
      whileTap={onClick ? motionTokens.presets.userPill.tap : undefined}
      transition={{ duration: motionTokens.duration.swift / 1000 }}
      data-slot="user-pill"
      data-status={status}
      data-focus={isContributionFocus}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1',
        'bg-white/10 backdrop-blur-sm',
        'transition-colors duration-micro',
        onClick && 'cursor-pointer hover:bg-white/15',
        isContributionFocus && 'ring-2 ring-offset-1 ring-offset-background',
        statusOpacity[status],
        className
      )}
      style={
        isContributionFocus
          ? ({ '--tw-ring-color': cursorColor } as React.CSSProperties)
          : undefined
      }
      onClick={onClick}
      {...props}
    >
      <Avatar
        size="sm"
        cursorColor={cursorColor}
        status={status === 'typing' ? 'typing' : 'active'}
      >
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={user.name} />
        ) : (
          <AvatarFallback fallbackColor={cursorColor}>
            {user.initials || user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>

      {getStatusContent()}

      {isContributionFocus && onClose && (
        <IconButton
          aria-label="Exit contribution focus"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="ml-1 -mr-1.5"
        >
          <X weight="bold" />
        </IconButton>
      )}
    </motion.div>
  );
}

export { UserPill };
