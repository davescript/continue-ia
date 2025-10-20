const Loader = ({ message = 'Carregando conteúdo exclusivo…' }) => (
  <div
    style={{
      padding: '4rem 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      color: 'var(--color-muted)',
    }}
  >
    <span
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        border: '3px solid rgba(184, 92, 89, 0.2)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.9s linear infinite',
      }}
    />
    <p>{message}</p>
  </div>
);

export default Loader;
