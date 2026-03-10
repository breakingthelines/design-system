import * as React from 'react';

import { cn } from '#/lib/utils';

interface FooterLink {
  label: string;
  href: string;
}

interface SiteFooterProps extends React.ComponentProps<'footer'> {
  /** Navigation links. Defaults to HOME, MEDIA, PODCASTS, ZINE, CONTACT */
  links?: FooterLink[];
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Copyright year range */
  copyright?: string;
  /** Logo render prop — allows custom SVG/image */
  logo?: React.ReactNode;
}

const defaultLinks: FooterLink[] = [
  { label: 'HOME', href: '/' },
  { label: 'MEDIA', href: '/media' },
  { label: 'PODCASTS', href: '/podcasts' },
  { label: 'ZINE', href: '/zine' },
  { label: 'CONTACT', href: '/contact' },
];

function BtlLogo() {
  return (
    <svg
      viewBox="0 0 40 39"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-10"
      aria-label="Breaking The Lines"
    >
      <rect width="40" height="39" rx="2" className="fill-red-100" />
      <rect x="8" y="6" width="10" height="12" rx="1" className="fill-white" />
      <rect x="22" y="21" width="10" height="12" rx="1" className="fill-white" />
    </svg>
  );
}

function SiteFooter({
  className,
  links = defaultLinks,
  email = 'contact@breakingthelines.com',
  phone = '231 + 83752086',
  copyright = '© 2013–2025',
  logo,
  ...props
}: SiteFooterProps) {
  return (
    <footer
      data-slot="site-footer"
      className={cn(
        'border-t border-grey-300 bg-black px-6 py-16 sm:px-12 lg:px-[148px] lg:py-[100px]',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-24 lg:gap-[164px]">
        {/* Top row: logo + nav */}
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:justify-between">
          {logo ?? <BtlLogo />}
          <nav className="flex flex-wrap gap-8 lg:gap-12">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs tracking-[0.1em] text-muted-text transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom row: contact + copyright */}
        <div className="flex flex-col gap-4 text-white">
          <div className="flex flex-col gap-2 text-sm font-medium">
            <a href={`mailto:${email}`} className="hover:text-red-100 transition-colors">
              {email}
            </a>
            <p>{phone}</p>
          </div>
          <p className="text-xs">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter, type SiteFooterProps, type FooterLink };
