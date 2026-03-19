'use client';

import * as React from 'react';
import { CaretUp } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { useLinkComponent } from '#/components/ui/link-context';

interface FooterLink {
  label: string;
  href: string;
  /** Submenu items — renders a popover trigger instead of a direct link */
  children?: FooterLink[];
}

interface SiteFooterProps extends React.ComponentProps<'footer'> {
  /** Navigation links. Defaults to HOME, THOUGHTS, MEDIA (BTL TV, PODCASTS, ZINE), CONTACT */
  links?: FooterLink[];
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Copyright year range */
  copyright?: string;
  /** URL the logo links to (default: '/') */
  logoHref?: string;
  /** Logo render prop — allows custom SVG/image */
  logo?: React.ReactNode;
}

const defaultLinks: FooterLink[] = [
  { label: 'HOME', href: '/' },
  { label: 'THOUGHTS', href: '/thoughts' },
  {
    label: 'MEDIA',
    href: '/media',
    children: [
      { label: 'BTL TV', href: '/btl-tv' },
      { label: 'BTL PODCASTS', href: '/podcasts' },
      { label: 'ZINE', href: '/zine' },
    ],
  },
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

/* ── Footer link with optional submenu popover ─────────────────────────── */
function FooterNavItem({ link }: { link: FooterLink }) {
  const LinkComponent = useLinkComponent();
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(null);

  if (!link.children?.length) {
    return (
      <LinkComponent
        href={link.href}
        className="cursor-pointer text-xs tracking-[0.1em] text-muted-text transition-colors hover:text-white"
      >
        {link.label}
      </LinkComponent>
    );
  }

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 text-xs tracking-[0.1em] transition-colors',
          open ? 'text-white' : 'text-muted-text hover:text-white'
        )}
        aria-expanded={open}
      >
        {link.label}
        <CaretUp
          weight="bold"
          className={cn(
            'size-3 transition-transform duration-200',
            open ? 'rotate-0' : 'rotate-180'
          )}
        />
      </button>

      {/* Popover — opens upward from footer */}
      <div
        className={cn(
          'absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2',
          'pointer-events-none opacity-0 translate-y-2',
          'transition-all duration-200 ease-out',
          open && 'pointer-events-auto opacity-100 translate-y-0'
        )}
      >
        {/* Glass panel */}
        <div className="relative min-w-[160px] overflow-hidden rounded-[2px] border border-white/10 bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl">
          {/* Subtle top accent line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-100/50 to-transparent" />
          <nav className="flex flex-col gap-0.5">
            {link.children.map((child) => (
              <LinkComponent
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className="block rounded-[2px] px-4 py-2.5 text-xs tracking-[0.08em] text-muted-text transition-colors hover:bg-white/5 hover:text-white"
              >
                {child.label}
              </LinkComponent>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

function SiteFooter({
  className,
  links = defaultLinks,
  email = 'hello@breakingthelines.com',
  phone,
  copyright = `© ${new Date().getFullYear()}`,
  logoHref = '/',
  logo,
  ...props
}: SiteFooterProps) {
  const LinkComponent = useLinkComponent();

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
          <LinkComponent href={logoHref}>{logo ?? <BtlLogo />}</LinkComponent>
          <nav className="flex flex-wrap items-center gap-8 lg:gap-12">
            {links.map((link) => (
              <FooterNavItem key={link.href} link={link} />
            ))}
          </nav>
        </div>

        {/* Bottom row: contact + copyright */}
        <div className="flex flex-col gap-[26px] text-white">
          <div className="flex flex-col gap-[13px] text-sm font-medium">
            <a
              href={`mailto:${email}`}
              className="cursor-pointer hover:text-red-100 transition-colors"
            >
              {email}
            </a>
            {phone && <p>{phone}</p>}
          </div>
          <p className="text-xs">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter, type SiteFooterProps, type FooterLink };
