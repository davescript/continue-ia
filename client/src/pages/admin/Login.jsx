import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth.js';
import styles from './Login.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || '/admin';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <header className={styles.header}>
          <span className="badge">Acesso restrito</span>
          <h1>Painel Leia Sabores</h1>
          <p className="text-muted">
            Informe as credenciais para gerir catálogo, pedidos e conteúdos editoriais da Leia Sabores.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              required
              value={form.email}
              onChange={handleChange}
              placeholder="admin@leiasabores.pt"
              disabled={submitting || loading}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              required
              value={form.password}
              onChange={handleChange}
              placeholder="Sua senha secreta"
              disabled={submitting || loading}
            />
          </div>

          {error ? <div className={styles.error}>{error}</div> : null}

          <button type="submit" className={styles.submit} disabled={submitting || loading}>
            {submitting ? 'Entrando...' : 'Acessar painel'}
          </button>
        </form>

        <p className={styles.helper}>
          Precisa de ajuda? Escreva para suporte@leiasabores.pt.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
