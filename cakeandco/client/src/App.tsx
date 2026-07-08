import { Routes, Route } from "react-router-dom";
import GuestPage from "./pages/GuestPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<GuestPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
