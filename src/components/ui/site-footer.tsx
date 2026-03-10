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

/** BTL bracket logo — two offset bracket shapes with red gradient fill (footer size) */
function BtlLogo() {
  return (
    <svg
      viewBox="0 0 40 38.53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-10 h-[38.53px]"
      aria-label="Breaking The Lines"
    >
      <defs>
        <linearGradient
          id="footer-logo-left"
          x1="0"
          y1="19.265"
          x2="17.142"
          y2="19.265"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E20613" />
          <stop offset="1" stopColor="#E5332A" />
        </linearGradient>
        <linearGradient
          id="footer-logo-right"
          x1="22.863"
          y1="19.265"
          x2="40"
          y2="19.265"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E20613" />
          <stop offset="1" stopColor="#E5332A" />
        </linearGradient>
      </defs>
      <path
        d="M17.142 0V11.709H12.442V26.83H17.142V38.53H0V0H17.142Z"
        fill="url(#footer-logo-left)"
      />
      <path
        d="M40 0V38.53H22.863V26.83H27.563V11.709H22.863V0H40Z"
        fill="url(#footer-logo-right)"
      />
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
        'border-t border-grey-100 bg-black px-8 py-20 sm:px-16 lg:px-[148px] lg:py-[100px]',
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
        <div className="flex flex-col gap-[26px] text-white">
          <div className="flex flex-col gap-[13px] text-sm font-medium">
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
