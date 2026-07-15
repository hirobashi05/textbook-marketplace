import { BookOpen, CreditCard, LogIn, LogOut, Plus, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
    isActive ? "bg-teal-50 text-campus" : "text-slate-600 hover:bg-slate-100"
  ].join(" ");

export function Layout() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-base font-bold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-campus text-white">
              <BookOpen size={20} aria-hidden />
            </span>
            Campus Textbook Reuse
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              <BookOpen size={17} aria-hidden />
              出品一覧
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/listings/new" className={navLinkClass}>
                  <Plus size={17} aria-hidden />
                  出品する
                </NavLink>
                <NavLink to="/mypage" className={navLinkClass}>
                  <UserRound size={17} aria-hidden />
                  マイページ
                </NavLink>
                <NavLink to="/mypage/payments" className={navLinkClass}>
                  <CreditCard size={17} aria-hidden />
                  支払い設定
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
                <button type="button" className="btn-secondary" onClick={handleLogout}>
                  <LogOut size={17} aria-hidden />
                  ログアウト
                </button>
              </>
            ) : (
              <Link className="btn-primary" to="/login">
                <LogIn size={17} aria-hidden />
                ログイン
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
