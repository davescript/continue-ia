import { useMemo } from 'react';
import { useAuth } from '../../context/useAuth.js';
import styles from './AdminTopbar.module.css';

const greetings = [
  'Bem-vinda de volta',
  'Olá, chef',
  'Pronta para encantar?',
  'Vamos criar memórias',
];

const AdminTopbar = () => {
  const { user, logout } = useAuth();

  const greeting = useMemo(
    () => greetings[new Date().getDay() % greetings.length],
    []
  );

  return (
    <header className={styles.topbar}>
      <div className={styles.welcome}>
        <span>{greeting}</span>
        <h2>Painel de controle</h2>
      </div>
      <div className={styles.actions}>
        <div className={styles.user}>
          <span className={styles.userName}>{user?.name}</span>
          <span className="text-muted">{user?.role === 'admin' ? 'Administrador' : user?.role}</span>
        </div>
        <button type="button" className={styles.logout} onClick={logout}>
          Sair
        </button>
      </div>
    </header>
  );
};

export default AdminTopbar;
