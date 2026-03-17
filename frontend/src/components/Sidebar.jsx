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
        : "hover:bg-primary-50 text-gray-700 hover:text-primary-700"
        }`}
    >
      <div className={`p-1.5 rounded-md transition-all duration-200 ${isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-primary-100"}`}>
        <Icon size={20} className={isActive ? "text-white" : "text-gray-600 group-hover:text-primary-600"} />
      </div>
      {!isCollapsed && (
        <span className={`font-medium text-sm flex-1 ${isActive ? "text-white" : "text-gray-700"}`}>
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
      <div className={`${isCollapsed ? "w-24" : "md:w-72 w-48"} h-screen flex flex-col ${isCollapsed ? "items-center" : ""} bg-white border-r border-gray-200 shadow-xl transition-all duration-300 ease-in-out overflow-hidden relative`}>
        {/* Gradient Accent */}
        <div className="absolute inset-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500"></div>

        {/* Header Section */}
        <div className="flex items-center justify-between p-4 gap-x-1 border-b border-gray-100">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md">
                <FiHome className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
                <p className="text-xs text-gray-500">Admin Panel</p>
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
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <VscLayoutSidebarLeft size={20} className="text-gray-600" />
            ) : (
              <VscLayoutSidebarLeftOff size={20} className="text-gray-600" />
            )}
          </button>
        </div>

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div
            onClick={toggleTheme}
            className={`flex items-center gap-x-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${theme === "dark"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
          >
            <div className={`p-1.5 rounded-md transition-all duration-300 ${theme === "dark" ? "bg-white/20" : "bg-white"
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

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hide-scrollbar">
          {!isCollapsed && (
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1 block">
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

        {/* User Profile Section */}
        <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="flex items-center gap-x-3 mb-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                <CgProfile className="text-white" size={20} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.username ?? "User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email ?? "Administrator"}</p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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