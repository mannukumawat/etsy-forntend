import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AccountLayout } from '@/layouts/AccountLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { RouteError } from '@/pages/RouteError';

// Pages are code-split; the layout's <Suspense> shows a spinner while a chunk loads.
const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const CollectionPage = lazy(() => import('@/pages/CollectionPage'));
const CategoryHubPage = lazy(() => import('@/pages/CategoryHubPage'));
const NewInPage = lazy(() => import('@/pages/NewInPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const PaymentFailedPage = lazy(() => import('@/pages/PaymentFailedPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const AccountPage = lazy(() => import('@/pages/account/AccountPage'));
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'));
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage'));
const ReturnsPage = lazy(() => import('@/pages/account/ReturnsPage'));
const ReturnDetailPage = lazy(() => import('@/pages/account/ReturnDetailPage'));
const WishlistPage = lazy(() => import('@/pages/WishlistPage'));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage'));
const AboutPage = lazy(() => import('@/pages/info/AboutPage'));
const ContactPage = lazy(() => import('@/pages/info/ContactPage'));
const FaqPage = lazy(() => import('@/pages/info/FaqPage'));
const ShippingPage = lazy(() => import('@/pages/info/ShippingPage'));
const PolicyPage = lazy(() => import('@/pages/info/PolicyPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/shop', element: <ShopPage /> },
      { path: '/category/:slug', element: <CategoryHubPage /> },
      { path: '/new-in', element: <NewInPage /> },
      { path: '/collection/:slug', element: <CollectionPage /> },
      { path: '/product/:slug', element: <ProductPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order/success/:orderId', element: <OrderSuccessPage /> },
      { path: '/order/payment-failed', element: <PaymentFailedPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      {
        path: '/account',
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:orderId', element: <OrderDetailPage /> },
          { path: 'returns', element: <ReturnsPage /> },
          { path: 'returns/:ref', element: <ReturnDetailPage /> },
          { path: 'addresses', element: <AddressesPage /> },
        ],
      },
      { path: '/wishlist', element: <WishlistPage /> },
      { path: '/track-order', element: <TrackOrderPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/shipping', element: <ShippingPage /> },
      { path: '/returns', element: <PolicyPage page="returns" /> },
      { path: '/privacy', element: <PolicyPage page="privacy" /> },
      { path: '/terms', element: <PolicyPage page="terms" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
