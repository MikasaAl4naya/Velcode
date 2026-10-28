'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModal } from '@/hooks/useModal';
import { NAV_LINKS } from '@/lib/siteData';
import { COMPANY_CONFIG } from '@/lib/company';
import { SocialLinks } from '@/components/ui/SocialLinks';

type HeaderProps = {
  currentPath?: string;
};

export function Header({ currentPath = '/' }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { openModal } = useModal();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isMobileMenu = window.matchMedia('(max-width: 991.98px)').matches;
      if (!isMobileMenu && isOpen) {
        setIsOpen(false);
      }
      if (navRef.current) {
        if (isOpen && isMobileMenu) {
          navRef.current.style.height = `${navRef.current.scrollHeight}px`;
        } else {
          navRef.current.style.height = '';
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className={`header ${isOpen ? 'header--menu-open' : ''}`} ref={headerRef}>
      <div className="header__container">
        <Link
          href="/"
          className="header__logo"
          onClick={() => { if (pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          {COMPANY_CONFIG.brandName}
        </Link>

        <nav className="header__nav" id="headerNav" ref={navRef} aria-label="Основная навигация">
          {NAV_LINKS.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`header__nav-link ${isActive ? 'header__nav-link--active' : ''}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            );
          })}

          <SocialLinks className="header__nav-socials" itemClassName="header__social" />
        </nav>

        <div className="header__actions">
          <button
            type="button"
            className="btn btn--header"
            onClick={() => {
              closeMenu();
              openModal();
            }}
          >
            Оставить заявку
          </button>

          <SocialLinks className="header__socials" itemClassName="header__social" />

          <button
            className="header__burger"
            id="burgerBtn"
            type="button"
            aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-controls="headerNav"
            aria-expanded={isOpen}
            onClick={toggleMenu}
          ></button>
        </div>
      </div>
    </header>
  );
}
