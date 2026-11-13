'use client';

import * as React from 'react';
import { CaretUp, XLogo, YoutubeLogo, LinkedinLogo, DiscordLogo } from '@phosphor-icons/react';

import { cn } from '#/lib/utils';
import { BtlLogo } from '#/components/ui/btl-logo';
import { useLinkComponent } from '#/components/ui/link-context';
import { CLOSED_FOOTER_MENU, footerMenuReducer } from '#/components/ui/site-footer-menu';

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
  /** Navigation links. Defaults to Arena, Thoughts, Media (BTL TV, BTL podcasts, Zine), About */
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
  { label: 'Arena', href: '/arena' },
  { label: 'Thoughts', href: '/thoughts' },
  {
    label: 'Media',
    href: '/media',
    children: [
      { label: 'BTL TV', href: '/tv' },
      { label: 'BTL podcasts', href: '/podcasts' },
      { label: 'Zine', href: '/zine' },
    ],
  },
  {
    label: 'About',
    href: '/credo',
    children: [
      { label: 'Credo', href: '/credo' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
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
  const [{ open }, dispatch] = React.useReducer(footerMenuReducer, CLOSED_FOOTER_MENU);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout>>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) dispatch('dismiss');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      dispatch('dismiss');
      if (rootRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  React.useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    []
  );

  if (!link.children?.length) {
    return (
      <LinkComponent
        href={link.href}
        className="inline-flex cursor-pointer items-center text-xs leading-4 text-muted-text transition-colors hover:text-white"
      >
        {link.label}
      </LinkComponent>
    );
  }

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    dispatch('enter');
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => dispatch('leave'), 150);
  };

  return (
    // A flex wrapper, not a block one: a block div puts the inline-flex button
    // on a line box sized by the inherited 16px/24px body text, which sat the
    // caret links about 2px below the plain ones.
    <div
      ref={rootRef}
      className="relative flex items-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        // Enter and Space fire a click with `detail === 0`; a pointer click
        // has a click count of 1 or more.
        onClick={(e) => dispatch(e.detail === 0 ? 'toggle' : 'click')}
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 text-xs leading-4 transition-colors',
          open ? 'text-white' : 'text-muted-text hover:text-white'
        )}
        aria-expanded={open}
        aria-controls={menuId}
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
        id={menuId}
        className={cn(
          'absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2',
          'pointer-events-none invisible opacity-0 translate-y-2',
          'transition-all duration-200 ease-out',
          open && 'pointer-events-auto visible opacity-100 translate-y-0'
        )}
      >
        {/* Flat panel with a hairline edge */}
        <div className="relative min-w-[160px] overflow-hidden rounded-[4px] border border-white/10 bg-grey-200/90 p-1 shadow-xl backdrop-blur-xl">
          <nav className="flex flex-col gap-0.5">
            {link.children.map((child) => (
              <LinkComponent
                key={child.href}
                href={child.href}
                onClick={() => dispatch('dismiss')}
                className="block rounded-[4px] px-4 py-2.5 text-xs text-muted-text transition-colors hover:bg-white/5 hover:text-white"
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
              {legalLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white/40 transition-colors hover:text-white/70"
                  >
                    {link.label}
                  </a>
                ) : (
                  <LinkComponent
                    key={link.href}
                    href={link.href}
                    className="text-xs text-white/40 transition-colors hover:text-white/70"
                  >
                    {link.label}
                  </LinkComponent>
                )
              )}
            </nav>
          </div>
        )}
      </div>
    </footer>
  );
}

export { SiteFooter, type SiteFooterProps, type FooterLink, type LegalLink, type FooterSocialLink };
