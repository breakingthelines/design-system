'use client';

import * as React from 'react';

type LinkComponent = React.ElementType<React.AnchorHTMLAttributes<HTMLAnchorElement>>;

interface LinkProviderProps {
  component: LinkComponent;
  children: React.ReactNode;
}

const LinkContext = React.createContext<LinkComponent>('a');

function LinkProvider({ component, children }: LinkProviderProps) {
  return <LinkContext value={component}>{children}</LinkContext>;
}

function useLinkComponent(): LinkComponent {
  return React.useContext(LinkContext);
}

export { LinkProvider, useLinkComponent, type LinkComponent, type LinkProviderProps };
