'use client';

import * as React from 'react';
import { CaretUp, XLogo, YoutubeLogo, LinkedinLogo, DiscordLogo } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { BtlLogo } from '#/components/ui/btl-logo';
import { useLinkComponent } from '#/components/ui/link-context';

interface FooterLink {
  label: string;
  href: string;
  /** Submenu items — renders a popover trigger instead of a direct link */
  children?: FooterLink[];
}

interface FooterSocialLink {
  platform: 'x' | 'youtube' | 'linkedin' | 'discord';
  href: string;
}

interface SiteFooterProps extends React.ComponentProps<'footer'> {
  /** Navigation links. Defaults to ARENA, THOUGHTS, MEDIA (BTL TV, PODCASTS, ZINE), ABOUT */
  links?: FooterLink[];
  /** Legal bar links (Terms, Privacy, Cookies, RSS, Sitemap) */
  legalLinks?: LegalLink[];
  /** Social media links */
  socials?: FooterSocialLink[];
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
  { label: 'ARENA', href: '/arena' },
  { label: 'THOUGHTS', href: '/thoughts' },
  {
    label: 'MEDIA',
    href: '/media',
    children: [
      { label: 'BTL TV', href: '/tv' },
      { label: 'BTL PODCASTS', href: '/podcasts' },
      { label: 'ZINE', href: '/zine' },
    ],
  },
  {
    label: 'ABOUT',
    href: '/credo',
    children: [
      { label: 'CREDO', href: '/credo' },
      { label: 'PRICING', href: '/pricing' },
      { label: 'CONTACT', href: '/contact' },
      { label: 'CAREERS', href: '/careers' },
    ],
  },
];

interface LegalLink {
  label: string;
  href: string;
  external?: boolean;
}

const defaultLegalLinks: LegalLink[] = [
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookies' },
  { label: 'RSS', href: '/feed.xml' },
  { label: 'Sitemap', href: '/sitemap' },
];

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
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
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

const socialIcons = {
  x: XLogo,
  youtube: YoutubeLogo,
  linkedin: LinkedinLogo,
  discord: DiscordLogo,
} as const;

const defaultSocials: FooterSocialLink[] = [
  { platform: 'x', href: 'https://x.com/breakthelines' },
  { platform: 'linkedin', href: 'https://www.linkedin.com/company/breaking-the-lines' },
  { platform: 'youtube', href: 'https://www.youtube.com/BreakingTheLinesFootball' },
  { platform: 'discord', href: 'https://discord.gg/RKsPDwjfJa' },
];

function SiteFooter({
  className,
  links = defaultLinks,
  legalLinks = defaultLegalLinks,
  socials = defaultSocials,
  email = 'hello@breakingthelines.com',
  phone,
  copyright = `© ${new Date().getFullYear()} Breaking The Lines`,
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
          <LinkComponent href={logoHref}>{logo ?? <BtlLogo className="size-10" />}</LinkComponent>
          <nav className="flex flex-wrap items-center gap-8 lg:gap-12">
            {links.map((link) => (
              <FooterNavItem key={link.href} link={link} />
            ))}
          </nav>
        </div>

        {/* Bottom row: contact + socials + copyright */}
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
          {socials && socials.length > 0 && (
            <div className="flex items-center gap-4">
              {socials.map((social) => {
                const Icon = socialIcons[social.platform];
                return (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className="text-white/40 transition-colors hover:text-white"
                  >
                    <Icon weight="regular" className="size-5" />
                  </a>
                );
              })}
            </div>
          )}
          <p className="text-xs">{copyright}</p>
        </div>

        {/* Legal bar */}
        {legalLinks.length > 0 && (
          <div className="border-t border-white/10 pt-6">
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {legalLinks.map((link, i) => (
                <React.Fragment key={link.href}>
                  {i > 0 && (
                    <span className="text-white/20 text-xs select-none" aria-hidden>
                      ·
                    </span>
                  )}
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/40 transition-colors hover:text-white/70"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <LinkComponent
                      href={link.href}
                      className="text-xs text-white/40 transition-colors hover:text-white/70"
                    >
                      {link.label}
                    </LinkComponent>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </div>
    </footer>
  );
}

export { SiteFooter, type SiteFooterProps, type FooterLink, type LegalLink, type FooterSocialLink };
