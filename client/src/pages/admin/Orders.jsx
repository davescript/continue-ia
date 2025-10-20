import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import api from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import styles from './Orders.module.css';

const parseStylePreferences = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.admin.getOrders();
      setOrders(response);
      setSelected((prev) => {
        if (!prev) return response[0] || null;
        return response.find((order) => order.id === prev.id) || response[0] || null;
      });
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openOrder = async (order) => {
    try {
      const fullOrder = await api.admin.getOrder(order.id);
      setSelected(fullOrder);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar detalhes do pedido.');
    }
  };

  return (
    <div>
      <header style={{ marginBottom: '2rem' }}>
        <span className="badge">Gestão de pedidos</span>
        <h1 style={{ marginTop: '1rem' }}>Consultorias em andamento</h1>
        <p className="text-muted" style={{ maxWidth: '620px', marginTop: '0.75rem' }}>
          Monitore leads do formulário, entenda preferências e dê andamento ao atendimento
          personalizado com rapidez.
        </p>
      </header>

      {error && !loading ? <ErrorState message={error} /> : null}

      {loading ? (
        <Loader message="Buscando pedidos..." />
      ) : orders.length === 0 ? (
        <ErrorState message="Nenhum pedido registrado até o momento." />
      ) : (
        <div className={styles.grid}>
          <section className={styles.list}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Lista de pedidos</h2>
                <p className="text-muted">
                  Clique para visualizar detalhes completos do briefing enviado.
                </p>
              </div>
              <span className={styles.tag}>{orders.length} registros</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Protocolo</th>
                    <th>Cliente</th>
                    <th>Evento</th>
                    <th>Evento em</th>
                    <th>Recebido há</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        background:
                          selected?.id === order.id ? 'rgba(184, 92, 89, 0.08)' : 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => openOrder(order)}
                    >
                      <td>{order.protocol}</td>
                      <td>{order.customer_name}</td>
                      <td>{order.event_type || 'Sob consulta'}</td>
                      <td>
                        {order.event_date
                          ? format(new Date(order.event_date), "dd/MM/yyyy", { locale: pt })
                          : 'A combinar'}
                      </td>
                      <td>
                        {order.created_at
                          ? formatDistanceToNow(new Date(order.created_at), { locale: pt, addSuffix: true })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.detail}>
            <div>
              <h2>Detalhes do pedido</h2>
              <p className="text-muted">
                Informações fornecidas pelo cliente e itens de interesse selecionados.
              </p>
            </div>

            {selected ? (
              <div className={styles.orderCard}>
                <span className={styles.tag}>{selected.protocol}</span>
                <strong>{selected.customer_name}</strong>
                <span className="text-muted">{selected.email}</span>
                {selected.phone ? <span className="text-muted">{selected.phone}</span> : null}

                <div>
                  <h4>Evento</h4>
                  <p className="text-muted">
                    {selected.event_type || 'A definir'} ·{' '}
                    {selected.event_date
                      ? format(new Date(selected.event_date), "dd 'de' MMMM yyyy", { locale: pt })
                      : 'Data a combinar'}
                  </p>
                  <p className="text-muted">
                    Convidados: {selected.guest_count || 'Sob consulta'} · Local:{' '}
                    {selected.venue || 'Não informado'}
                  </p>
                </div>

                <div>
                  <h4>Preferências</h4>
                  <p className="text-muted">
                    Orçamento: {selected.budget_range || 'A definir'}
                  </p>
                  {parseStylePreferences(selected.style_preferences).length ? (
                    <p className="text-muted">
                      Estilos: {parseStylePreferences(selected.style_preferences).join(', ')}
                    </p>
                  ) : null}
                  {selected.notes ? <p className="text-muted">Notas: {selected.notes}</p> : null}
                </div>

                <div className={styles.items}>
                  <h4>Itens solicitados</h4>
                  {selected.items && selected.items.length > 0 ? (
                    selected.items.map((item) => (
                      <div key={item.id} className={styles.item}>
                        <strong>Produto #{item.product_id || 'personalizado'}</strong>
                        <p className="text-muted">Quantidade: {item.quantity}</p>
                        {item.customization ? (
                          <p className="text-muted">
                            Observações:{' '}
                            {typeof item.customization === 'object'
                              ? JSON.stringify(item.customization)
                              : item.customization}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">Nenhum item específico selecionado.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted">Selecione um pedido para visualizar os detalhes.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default OrdersAdmin;
