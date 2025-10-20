import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Loader from '../components/common/Loader.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import PageRenderer from '../components/dynamic/PageRenderer.jsx';
import { api } from '../services/api.js';

const DynamicPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .getPageBySlug(slug)
      .then((payload) => {
        if (active) {
          setData(payload);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Não foi possível carregar esta página.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="section">
        <div className="container">
          <Loader message="Carregando conteúdo..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="container">
          <ErrorState message={error} />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return <PageRenderer page={data} />;
};

export default DynamicPage;
