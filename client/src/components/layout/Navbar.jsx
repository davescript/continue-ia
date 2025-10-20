import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles, ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/useCart.js';
import styles from './Navbar.module.css';

const links = [
  { label: 'Início', to: '/' },
  { label: 'Catálogo', to: '/acessorios' },
  { label: 'Destaque', to: '/destaque' },
  { label: 'Exemplo', to: '/p/pagina-exemplo' },
  { label: 'Editorial', to: '/p/home-editorial' },
  { label: 'Landing', to: '/p/landing-festas' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contato', to: '/contato' },
  { label: 'Painel', to: '/admin/login' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className={styles.header}>
      <div className={styles.announcement}>
        <div className={styles.announcementInner}>
          <span>
            <Sparkles size={18} />
            Materiais de festa premium com envios para todo Portugal
          </span>
          <span className="pill">Novas coleções infantis e temáticas</span>
        </div>
      </div>
      <div className="container">
        <div className={styles.navbar}>
          <NavLink to="/" className={styles.brand}>
            <img src="/logo.png" alt="Leia Sabores" className={styles.brandLogo} />
            <span className={styles.brandSubtitle}>Acessórios & decoração para festas</span>
          </NavLink>

          <nav>
            <ul className={styles.navList}>
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <NavLink to="/carrinho" className={styles.cta}>
            <ShoppingCart size={18} />
            Carrinho
            <span className={styles.cartBadge}>{totalItems}</span>
          </NavLink>

          <button
            type="button"
            className={styles.mobileToggle}
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div
          className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ''}`}
        >
          <ul className={styles.mobileList}>
            {links.map((link) => (
              <li key={link.to}>
                <NavLink className={styles.mobileLink} to={link.to}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <NavLink to="/carrinho" className={styles.mobileCTA}>
            <ShoppingCart size={18} />
            Carrinho ({totalItems})
          </NavLink>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
