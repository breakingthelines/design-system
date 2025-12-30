import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '#/lib/utils';
import { roleColors, type RoleType } from '#/tokens/colors';

const squadRoleBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        default: 'px-2 py-1 text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface SquadRoleBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof squadRoleBadgeVariants> {
  /** The role to display (captain, editor, viewer, or custom) */
  role: string;
}

function SquadRoleBadge({ className, role, size, style, ...props }: SquadRoleBadgeProps) {
  // Normalize role to lowercase for lookup
  const normalizedRole = role.toLowerCase() as RoleType;
  const colors = roleColors[normalizedRole] || roleColors.default;

  return (
    <span
      data-slot="squad-role-badge"
      data-role={normalizedRole}
      className={cn(squadRoleBadgeVariants({ size }), className)}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        ...style,
      }}
      {...props}
    >
      {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
    </span>
  );
}

export { SquadRoleBadge, squadRoleBadgeVariants };
