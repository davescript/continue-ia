import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cake,
  Palette,
  BookOpen,
  ShoppingBag,
  Users,
  Settings,
  LayoutTemplate,
} from 'lucide-react';
import styles from './AdminSidebar.module.css';

const navGroups = [
  {
    type: 'link',
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/admin',
    end: true,
  },
  {
    type: 'group',
    label: 'Produtos',
    icon: Cake,
    children: [
      { label: 'Todos os Produtos', to: '/admin/produtos' },
      { label: 'Bolos', to: '/admin/produtos/categoria/bolos-artisticos' },
      { label: 'Decoração', to: '/admin/produtos/categoria/decoracao-de-festas' },
      { label: 'Cupcakes', to: '/admin/produtos/categoria/doces-finos' },
      { label: 'Adicionar Novo', to: '/admin/produtos/novo', highlight: true },
    ],
  },
  {
    type: 'link',
    label: 'Pedidos',
    icon: ShoppingBag,
    to: '/admin/pedidos',
  },
  {
    type: 'link',
    label: 'Temas & Portfólio',
    icon: Palette,
    to: '/admin/temas',
  },
  {
    type: 'link',
    label: 'Conteúdo',
    icon: BookOpen,
    to: '/admin/conteudo',
  },
  {
    type: 'link',
    label: 'Construtor de páginas',
    icon: LayoutTemplate,
    to: '/admin/paginas',
  },
  {
    type: 'link',
    label: 'Clientes',
    icon: Users,
    to: '/admin/clientes',
    disabled: true,
  },
  {
    type: 'link',
    label: 'Configurações',
    icon: Settings,
    to: '/admin/configuracoes',
    disabled: true,
  },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandTitle}>Leia Sabores</span>
        <span className={styles.brandSubtitle}>Painel Administrativo</span>
        <span className={styles.badge}>Lisboa · Portugal</span>
      </div>

      <nav className={styles.nav}>
        {navGroups.map((item) => {
          if (item.type === 'link') {
            const Icon = item.icon;
            const isDisabled = item.disabled;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    styles.link,
                    isActive ? styles.linkActive : '',
                    isDisabled ? styles.disabled : '',
                  ].join(' ')
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          const Icon = item.icon;
          const isGroupActive = item.children.some((child) =>
            location.pathname.startsWith(child.to)
          );

          return (
            <div
              key={item.label}
              className={`${styles.group} ${isGroupActive ? styles.groupActive : ''}`}
            >
              <div className={styles.groupHeader}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              <div className={styles.subnav}>
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive }) =>
                      [
                        styles.sublink,
                        isActive ? styles.sublinkActive : '',
                        child.highlight ? styles.highlight : '',
                      ].join(' ')
                    }
                  >
                    <span>{child.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
