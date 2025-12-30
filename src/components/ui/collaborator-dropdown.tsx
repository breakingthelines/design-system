'use client';

import * as React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback, type AvatarStatus } from './avatar';
import { SquadRoleBadge } from './squad-role-badge';
import { Input } from './input';

export interface CollaboratorDropdownUser {
  id: string;
  name: string;
  avatarUrl?: string;
  initials?: string;
  cursorColor: string;
  role?: string;
  status?: AvatarStatus | 'away';
}

export interface CollaboratorDropdownProps {
  users: CollaboratorDropdownUser[];
  onUserClick?: (userId: string) => void;
  trigger: React.ReactNode;
  className?: string;
}

function getStatusLabel(status?: AvatarStatus | 'away'): string {
  switch (status) {
    case 'typing':
      return 'Typing...';
    case 'idle':
      return 'Idle';
    case 'away':
      return 'Away';
    default:
      return 'Active';
  }
}

function CollaboratorDropdown({
  users,
  onUserClick,
  trigger,
  className,
}: CollaboratorDropdownProps) {
  const [search, setSearch] = React.useState('');
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const showSearch = users.length >= 10;

  const filteredUsers = React.useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [users, search]);

  // Reset highlighted index when search changes
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredUsers[highlightedIndex]) {
          onUserClick?.(filteredUsers[highlightedIndex].id);
        }
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<span className="inline-flex">{trigger}</span>} />
      <DropdownMenuContent
        className={cn('w-72 p-0', className)}
        align="end"
        onKeyDown={handleKeyDown}
      >
        {showSearch && (
          <div className="border-b border-border p-2">
            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search collaborators..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8"
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="max-h-64 overflow-y-auto py-1">
          {filteredUsers.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No collaborators found
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onUserClick?.(user.id)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left',
                  'transition-colors',
                  index === highlightedIndex && 'bg-accent text-accent-foreground',
                  'focus:outline-none'
                )}
              >
                <Avatar size="default" cursorColor={user.cursorColor}>
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : (
                    <AvatarFallback fallbackColor={user.cursorColor}>
                      {user.initials || user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{getStatusLabel(user.status)}</div>
                </div>

                {user.role && <SquadRoleBadge role={user.role} size="sm" />}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { CollaboratorDropdown };
