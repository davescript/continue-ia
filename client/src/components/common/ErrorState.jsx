import { AlertTriangle } from 'lucide-react';

const ErrorState = ({ message = 'Não foi possível carregar os dados.', onRetry }) => (
  <div
    style={{
      padding: '4rem 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      color: 'var(--color-primary)',
    }}
  >
    <AlertTriangle size={32} />
    <p>{message}</p>
    {onRetry ? (
      <button type="button" className="button button--ghost" onClick={onRetry}>
        Tentar novamente
      </button>
    ) : null}
  </div>
);

export default ErrorState;
