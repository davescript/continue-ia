import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import AdminSidebar from '../admin/AdminSidebar.jsx';
import AdminTopbar from '../admin/AdminTopbar.jsx';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className={styles.wrapper} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ padding: '2rem 3rem', textAlign: 'center' }}>
          <span className="badge">Acessando painel</span>
          <p className="text-muted" style={{ marginTop: '1rem' }}>
            Validando suas credenciais...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <div className={styles.wrapper}>
      <AdminSidebar />
      <div className={styles.content}>
        <AdminTopbar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
