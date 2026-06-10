'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '#/lib/utils';
import { motion as motionTokens } from '#/tokens/motion';
import { Avatar, AvatarImage, AvatarFallback, type AvatarStatus } from './avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip';

export interface AvatarStackUser {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
  cursorColor: string;
  status?: AvatarStatus;
  tooltip?: string;
}

export interface AvatarStackProps extends React.HTMLAttributes<HTMLDivElement> {
  users: AvatarStackUser[];
  /** Maximum avatars to show before overflow. Responsive default: 4/6/8 */
  max?: number;
  /** Currently selected user ID for contribution focus */
  selectedUserId?: string;
  onUserClick?: (userId: string) => void;
  onUserHover?: (userId: string | null) => void;
  /** Called when "+N" overflow pill is clicked */
  onOverflowClick?: () => void;
  /** Avatar size */
  size?: 'sm' | 'default' | 'lg';
}

function useResponsiveMax(providedMax?: number): number {
  const [max, setMax] = React.useState(providedMax ?? 6);

  React.useEffect(() => {
    if (providedMax !== undefined) {
      setMax(providedMax);
      return;
    }

    const updateMax = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setMax(4);
      } else if (width < 1024) {
        setMax(6);
      } else {
        setMax(8);
      }
    };

    updateMax();
    window.addEventListener('resize', updateMax);
    return () => window.removeEventListener('resize', updateMax);
  }, [providedMax]);

  return max;
}

function AvatarStack({
  users,
  max: providedMax,
  selectedUserId,
  onUserClick,
  onUserHover,
  onOverflowClick,
  size = 'default',
  className,
  ...props
}: AvatarStackProps) {
  const max = useResponsiveMax(providedMax);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const visibleUsers = users.slice(0, max);
  const overflowCount = users.length - max;

  const handleHover = (userId: string | null) => {
    setHoveredId(userId);
    onUserHover?.(userId);
  };

  const sizeClasses = {
    sm: 'size-6',
    default: 'size-8',
    lg: 'size-10',
  };

  return (
    <div
      data-slot="avatar-stack"
      className={cn('flex items-center -space-x-2', className)}
      {...props}
    >
      {/* initial={false} skips the enter animation for avatars present on first
          paint (no fly-in on load) while still springing in members added live. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {visibleUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={motionTokens.presets.avatarEnter.initial}
            animate={motionTokens.presets.avatarEnter.animate}
            exit={motionTokens.presets.avatarExit.exit}
            transition={motionTokens.spring.shift}
            layout
            className="relative"
            style={{ zIndex: hoveredId === user.id ? 50 : visibleUsers.length - index }}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <motion.button
                    type="button"
                    whileHover={motionTokens.presets.avatar.hover}
                    whileTap={onUserClick ? motionTokens.presets.avatar.tap : undefined}
                    transition={motionTokens.spring.pop}
                    className={cn(
                      'relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selectedUserId === user.id && 'ring-2 ring-offset-2 ring-offset-background'
                    )}
                    style={
                      selectedUserId === user.id
                        ? ({ '--tw-ring-color': user.cursorColor } as React.CSSProperties)
                        : undefined
                    }
                    aria-label={user.tooltip ? `${user.name}. ${user.tooltip}` : user.name}
                    onClick={() => onUserClick?.(user.id)}
                    onMouseEnter={() => handleHover(user.id)}
                    onMouseLeave={() => handleHover(null)}
                  />
                }
              >
                <Avatar size={size} cursorColor={user.cursorColor} status={user.status}>
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <AvatarFallback fallbackColor={user.cursorColor}>
                      {user.initials || user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                showArrow={false}
                className="rounded-[10px] border border-white/10 bg-black/90 px-3 py-2 text-left text-white shadow-xl backdrop-blur-sm"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{user.name}</span>
                  {user.tooltip ? (
                    <span className="text-[11px] leading-relaxed text-white/70">
                      {user.tooltip}
                    </span>
                  ) : null}
                </div>
              </TooltipContent>
            </Tooltip>
          </motion.div>
        ))}
      </AnimatePresence>

      {overflowCount > 0 && (
        <motion.button
          type="button"
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={motionTokens.spring.shift}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onOverflowClick}
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded-full',
            'bg-grey-300 text-white text-xs font-medium',
            'ring-2 ring-background',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            sizeClasses[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{overflowCount}
        </motion.button>
      )}
    </div>
  );
}

export { AvatarStack };
