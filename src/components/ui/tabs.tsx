'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '#/lib/utils';

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  );
}

function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'relative inline-flex h-9 items-center gap-1 border-b border-white/10 px-0',
        className
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        data-slot="tabs-indicator"
        className="bg-foreground pointer-events-none absolute bottom-0 h-px transition-all duration-200 ease-out"
        style={{
          left: 'var(--active-tab-left)',
          width: 'var(--active-tab-width)',
        }}
      />
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'text-muted-foreground relative inline-flex h-9 cursor-pointer items-center justify-center border-0 bg-transparent px-3 text-xs font-medium tracking-wide whitespace-nowrap transition-colors outline-none',
        'hover:text-foreground/80',
        'data-selected:text-foreground',
        'focus-visible:text-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
