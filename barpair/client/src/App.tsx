import { Routes, Route, Navigate } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import GuestPage from "./pages/GuestPage";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="/guest" element={<GuestPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
