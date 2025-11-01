// Navigate.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Wallet, BarChart3, User } from "lucide-react"; // npm i lucide-react

export default function Navigate() {
  const location = useLocation();
  const nav = useNavigate();

  const items = [
    { name: "Home",       icon: Home,      path: "/home" },
    { name: "Expense",    icon: Wallet,    path: "/expense" },
    { name: "Statistics", icon: BarChart3, path: "/statistic" },
    { name: "Profile",    icon: User,      path: "/profile" },
  ];

  const isActive = (p) =>
    location.pathname === p || location.pathname.startsWith(p + "/");

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-white/95 backdrop-blur
        border-t border-slate-200
        shadow-[0_-4px_12px_rgba(0,0,0,0.04)]
        pb-[env(safe-area-inset-bottom)]
      "
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-md mx-auto">
        <ul className="flex">
          {items.map(({ name, icon: Icon, path }) => {
            const active = isActive(path);
            return (
              <li key={name} className="flex-1">
                <button
                  onClick={() => nav(path)}
                  className={`
                    w-full flex flex-col items-center justify-center gap-0.5
                    px-3 py-2.5
                    text-[11px] font-medium
                    focus-visible:outline focus-visible:outline-amber-400
                    ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"}
                  `}
                  aria-label={name}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`
                      grid place-items-center h-9 w-9 rounded-full
                      transition-all
                      ${active
                        ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                        : "text-slate-600"
                      }
                    `}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <span className={active ? "font-semibold" : ""}>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
