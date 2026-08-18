import type { AdminTab } from "../../types"

interface AdminSidebarProps {
  currentTab: AdminTab
  onSelectTab: (tab: AdminTab) => void
  userCount: number
  roleCount: number
  permissionCount: number
}

export default function AdminSidebar({
  currentTab,
  onSelectTab,
  userCount,
  roleCount,
  permissionCount,
}: AdminSidebarProps) {
  const navItems: Array<{
    id: AdminTab
    label: string
    sublabel: string
    count?: number
    icon: React.ReactNode
  }> = [
    {
      id: "dashboard",
      label: "Tổng quan",
      sublabel: "Dashboard & Thống kê",
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      id: "users",
      label: "Người dùng (Users)",
      sublabel: "Quản lý & gán vai trò",
      count: userCount,
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      id: "roles",
      label: "Vai trò (Roles)",
      sublabel: "3 Vai trò chính",
      count: roleCount,
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
    },
    {
      id: "permissions",
      label: "Quyền hạn (Permissions)",
      sublabel: "CRUD tài nguyên",
      count: permissionCount,
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white select-none shadow-[1px_0_3px_0_rgba(0,0,0,0.02)]">
      {/* Sidebar Navigation */}
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Quản trị
            </span>
          </div>

          <nav className="space-y-1.5 mt-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-50/80 text-blue-700 font-bold shadow-xs border border-blue-200/60"
                      : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <span className="block leading-none text-xs">{item.label}</span>
                      <span className="block text-[10px] text-slate-400 font-normal leading-none mt-1">
                        {item.sublabel}
                      </span>
                    </div>
                  </div>

                  {item.count !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Summary Info Card */}
      <div className="border-t border-slate-200/80 p-4 bg-slate-50/70">
        <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-slate-800">JobMatch RBAC</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-500 leading-normal">
            3 Vai trò chuẩn: Super Admin, Admin, User. Phân quyền chi tiết từng chức năng.
          </p>
        </div>
      </div>
    </aside>
  )
}
