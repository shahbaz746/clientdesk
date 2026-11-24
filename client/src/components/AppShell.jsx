import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppShell() {
  const { user, logout, showToast } = useAuth();
  const navigate = useNavigate();
  const isDeveloper = user?.role === "developer";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      showToast("Could not log out. Check your connection and try again.");
    }
  };

  const links = isDeveloper
    ? [
        { to: "/developer", label: "Dashboard" },
        { to: "/developer/clients", label: "Clients" },
        { to: "/developer/websites", label: "Websites" },
        { to: "/developer/requests", label: "Requests" },
      ]
    : [
        { to: "/client", label: "Dashboard" },
        { to: "/client/websites", label: "My websites" },
        { to: "/client/requests", label: "Requests" },
        { to: "/client/requests/new", label: "New request" },
      ];

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="border-b border-slate-200 bg-slate-950 text-white lg:w-64 lg:border-b-0 lg:border-r">
        <div className="px-6 py-5">
          <p className="text-lg font-semibold tracking-tight">Clientdesk</p>
          <p className="mt-1 text-xs text-slate-400">
            {isDeveloper ? "Developer workspace" : "Client portal"}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/developer" || link.to === "/client"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-teal-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-slate-800 px-6 py-4 lg:block">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
          <button
            className="mt-3 text-sm text-teal-400 hover:text-teal-300"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <p className="text-sm text-slate-500">Website maintenance requests</p>
          <button
            className="text-sm font-medium text-slate-600 lg:hidden"
            onClick={handleLogout}
          >
            Log out
          </button>
        </header>
        <main className="px-4 py-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
