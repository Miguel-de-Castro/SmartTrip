import React from "react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  isDarkMode: boolean;
  isDesktopLayout: boolean;
  onToggleDarkMode: () => void;
  onToggleDesktopLayout: () => void;
  onOpenSettings: () => void;
  hideValues?: boolean;
  onToggleHideValues?: () => void;
  showProfile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  isDarkMode,
  isDesktopLayout,
  onToggleDarkMode,
  onToggleDesktopLayout,
  onOpenSettings,
  hideValues,
  onToggleHideValues,
  showProfile = false,
}) => {
  return (
    <div className="bg-brand-500 dark:bg-brand-600 pt-10 pb-28 px-6 rounded-b-[3.5rem] shadow-xl relative z-10 transition-colors duration-500">
      <div
        className={`${isDesktopLayout ? "max-w-[1400px]" : "max-w-xl"} mx-auto flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          {showProfile ? (
            <div className="w-12 h-12 rounded-full border-2 border-white/40 bg-white/20 flex items-center justify-center overflow-hidden backdrop-blur-md">
              <i className="fa-solid fa-user text-white text-xl"></i>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl border-2 border-white/40 bg-white/20 flex items-center justify-center backdrop-blur-md">
              <i className="fa-solid fa-wallet text-white text-xl"></i>
            </div>
          )}
          <div>
            <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
              {subtitle || "Sua Viagem,"}
            </p>
            <h2 className="text-white text-2xl font-black tracking-tighter leading-none">
              {title || "Smart"}
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
          {onToggleHideValues !== undefined && (
            <button
              onClick={onToggleHideValues}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center border border-white/10"
            >
              <i
                className={`fa-solid ${hideValues ? "fa-eye-slash" : "fa-eye"} text-xs`}
              ></i>
            </button>
          )}
          <button
            onClick={onToggleDarkMode}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center border border-white/10"
          >
            <i
              className={`fa-solid ${isDarkMode ? "fa-sun text-amber-300" : "fa-moon"} text-xs`}
            ></i>
          </button>
          <button
            onClick={onToggleDesktopLayout}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center border border-white/10"
            title={
              isDesktopLayout ? "Usar layout mobile" : "Usar layout desktop"
            }
          >
            <i
              className={`fa-solid ${isDesktopLayout ? "fa-mobile-screen-button" : "fa-desktop"} text-xs`}
            ></i>
          </button>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center border border-white/10"
          >
            <i className="fa-solid fa-gear text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
