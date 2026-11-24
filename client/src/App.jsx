import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Websites from "./pages/Websites";
import RequestList from "./pages/RequestList";
import RequestDetail from "./pages/RequestDetail";
import NewRequest from "./pages/NewRequest";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute role="developer">
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/developer" element={<Dashboard />} />
        <Route path="/developer/clients" element={<Clients />} />
        <Route path="/developer/websites" element={<Websites />} />
        <Route path="/developer/requests" element={<RequestList />} />
        <Route path="/developer/requests/:id" element={<RequestDetail />} />
      </Route>

      <Route
        element={
          <ProtectedRoute role="client">
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/client" element={<Dashboard />} />
        <Route path="/client/websites" element={<Websites />} />
        <Route path="/client/requests" element={<RequestList />} />
        <Route path="/client/requests/new" element={<NewRequest />} />
        <Route path="/client/requests/:id" element={<RequestDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
