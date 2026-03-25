import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CgProfile } from "react-icons/cg";
import { IoLogOutOutline } from "react-icons/io5";
import { CgDarkMode } from "react-icons/cg";
import { VscLayoutSidebarLeftOff, VscLayoutSidebarLeft } from "react-icons/vsc";
import { FiHome, FiCode, FiList, FiGrid } from "react-icons/fi";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext.jsx";

function NavLink({ isCollapsed, title, icon, to, onClick }) {
  const Icon = icon;
  const isActive = onClick === undefined ? false : false;
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${isActive
        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30"
        : "hover:bg-[var(--color-card-hover)] text-[var(--color-text-secondary)] hover:text-primary-600"
        }`}
    >
      <div className={`p-1.5 rounded-md transition-all duration-200 ${isActive ? "bg-white/20" : "bg-[var(--color-card-hover)] group-hover:bg-primary-100/50"}`}>
        <Icon size={20} className={isActive ? "text-white" : "text-[var(--color-text-muted)] group-hover:text-primary-600"} />
      </div>
      {!isCollapsed && (
        <span className={`font-medium text-sm flex-1 ${isActive ? "text-white" : "text-[var(--color-text)]"}`}>
          {title}
        </span>
      )}
    </div>
  );
}

function SideBar() {
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className={`${isCollapsed ? "w-24" : "md:w-72 w-48"} h-screen flex flex-col ${isCollapsed ? "items-center" : ""} bg-[var(--color-sidebar)] border-r border-[var(--color-border)] shadow-xl transition-all duration-300 ease-in-out overflow-hidden relative`}>
        <div className="absolute inset-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500"></div>

        <div className="flex items-center justify-between p-4 gap-x-1 border-b border-[var(--color-border)]">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                <FiHome className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text)]">Dashboard</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Admin Panel</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 p-1 bg-gradient-to-br justify-self-start from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md mx-auto">
              <FiHome className="text-white" size={18} />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(prev => !prev)}
            className="p-2 hover:bg-[var(--color-card-hover)] rounded-lg transition-all duration-200 hover:scale-105"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <VscLayoutSidebarLeft size={20} className="text-[var(--color-text-muted)]" />
            ) : (
              <VscLayoutSidebarLeftOff size={20} className="text-[var(--color-text-muted)]" />
            )}
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <div
            onClick={toggleTheme}
            className={`flex items-center gap-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${theme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-[var(--color-card-hover)] hover:brightness-95 text-[var(--color-text)]"
              }`}
          >
            <div className={`p-1.5 rounded-md transition-all duration-300 ${theme === "dark" ? "bg-white/20" : "bg-[var(--color-card)]"
              }`}>
              <CgDarkMode
                className={`transition-transform duration-500 ${theme === "dark" ? "rotate-180" : "rotate-0"}`}
                size={18}
              />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm flex-1">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hide-scrollbar">
          {!isCollapsed && (
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-1 block">
              Platform
            </span>
          )}
          <NavLink
            isCollapsed={isCollapsed}
            title="Dashboard"
            icon={FiHome}
            onClick={() => navigate("/dashboard")}
          />
          <NavLink
            isCollapsed={isCollapsed}
            title="Repos"
            icon={FiGrid}
            onClick={() => navigate("/repos")}
          />
          <NavLink
            isCollapsed={isCollapsed}
            title="Challenges"
            icon={FiList}
            onClick={() => navigate("/challenges")}
          />
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
          <div className="flex items-center gap-x-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-[var(--color-card)]">
                <CgProfile className="text-white" size={20} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--color-card)]"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)] truncate">{user?.username ?? "User"}</p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email ?? "Administrator"}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-1 px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-card)] hover:bg-[var(--color-card-hover)] rounded-lg transition-colors duration-200 border border-[var(--color-border)]"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-error-bg)] rounded-lg transition-all duration-200"
                aria-label="Log out"
              >
                <IoLogOutOutline size={20} />
              </button>
            </div>
          )}

          {isCollapsed && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-error-bg)] rounded-lg transition-all duration-200"
                aria-label="Log out"
              >
                <IoLogOutOutline size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default SideBar;
