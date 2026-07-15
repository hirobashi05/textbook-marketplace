import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CreateListingPage } from "./pages/CreateListingPage";
import { ListingDetailPage } from "./pages/ListingDetailPage";
import { ListingsPage } from "./pages/ListingsPage";
import { LoginPage } from "./pages/LoginPage";
import { MyPage } from "./pages/MyPage";
import { PaymentSettingsPage } from "./pages/PaymentSettingsPage";
import { PurchasePage } from "./pages/PurchasePage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ListingsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/listings/new" element={<CreateListingPage />} />
          <Route path="/purchase/:id" element={<PurchasePage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/payments" element={<PaymentSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
