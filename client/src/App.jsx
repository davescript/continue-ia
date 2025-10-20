import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import WhatsAppButton from './components/common/WhatsAppButton.jsx';
import Home from './pages/Home.jsx';
import Accessories from './pages/Accessories.jsx';
import Cart from './pages/Cart.jsx';
import FeatureShowcase from './pages/FeatureShowcase.jsx';
import DynamicPage from './pages/DynamicPage.jsx';
import Blog from './pages/Blog.jsx';
import BlogPost from './pages/BlogPost.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import ProductsList from './pages/admin/ProductsList.jsx';
import AdminProductsManage from './pages/admin/Products.jsx';
import ThemesAdmin from './pages/admin/Themes.jsx';
import ContentAdmin from './pages/admin/Content.jsx';
import OrdersAdmin from './pages/admin/Orders.jsx';
import PageList from './pages/admin/PageList.jsx';
import PageEditor from './pages/admin/PageEditor.jsx';

const App = () => (
  <>
    <ScrollToTop />
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="acessorios" element={<Accessories />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="destaque" element={<FeatureShowcase />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="contato" element={<Contact />} />
        <Route path="p/:slug" element={<DynamicPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="admin">
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="produtos">
            <Route index element={<ProductsList />} />
            <Route path="categoria/:slug" element={<ProductsList />} />
            <Route path="novo" element={<AdminProductsManage />} />
          </Route>
          <Route path="temas" element={<ThemesAdmin />} />
          <Route path="conteudo" element={<ContentAdmin />} />
          <Route path="pedidos" element={<OrdersAdmin />} />
          <Route path="paginas">
            <Route index element={<PageList />} />
            <Route path=":id" element={<PageEditor />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
    <WhatsAppButton />
  </>
);

export default App;
