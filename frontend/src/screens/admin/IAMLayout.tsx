import type { ReactNode } from "react"
import AdminSidebar from "./AdminSidebar"
import type { AdminTab } from "../../types"

interface BreadcrumbItem {
  label: string
  onClick?: () => void
  active?: boolean
}

interface IAMLayoutProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  userCount: number
  roleCount: number
  permissionCount: number
  breadcrumbs: BreadcrumbItem[]
  children: ReactNode
}

export default function IAMLayout({
  currentTab,
  onSelectTab,
  userCount,
  roleCount,
  permissionCount,
  breadcrumbs,
  children,
}: IAMLayoutProps) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Ultra-Premium Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#1E293B] bg-[#0B132B] px-6 text-white shadow-sm z-30 select-none">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  JobMatch Admin
                </span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/30">
                  RBAC Control Plane
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          <span className="hidden text-xs text-slate-400 md:inline font-medium">
            Quản trị định danh & Phân quyền tài khoản
          </span>
        </div>

        {/* Right Info & Profile */}
        <div className="flex items-center gap-4">
          {/* Live Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20 shadow-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>Hệ thống hoạt động bình thường</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Current Admin User Badge */}
          <div className="flex items-center gap-2.5 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white border border-white/10 transition-colors cursor-pointer">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-[11px] font-bold text-white shadow-xs">
              S
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold leading-none text-slate-100">admin.super</p>
              <p className="text-[9px] text-purple-300 font-semibold leading-none mt-0.5">★ Super Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sleek Admin Navigation Sidebar */}
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          userCount={userCount}
          roleCount={roleCount}
          permissionCount={permissionCount}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
          {/* Breadcrumbs Navigation Bar */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-8 text-xs text-slate-500 shadow-xs z-20">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <svg className="size-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Quản trị
              </span>
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-slate-300">/</span>
                  {item.onClick && !item.active ? (
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span
                      className={
                        item.active
                          ? "font-semibold text-slate-900"
                          : "font-medium text-slate-500"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600 border border-slate-200">
                3 Roles · Granular Permissions
              </span>
            </div>
          </div>

          {/* Scrollable View Container */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-8 text-[11px] text-slate-500 z-20">
        <span>© 2026 JobMatch Platform · Phân hệ Quản trị & Phân quyền RBAC</span>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Bảo mật dữ liệu chuẩn Enterprise</span>
          <span>Phiên bản v2.5</span>
        </div>
      </footer>
    </div>
  )
}
