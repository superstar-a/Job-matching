import type { AdminTab, IAMUser, Role, Permission } from "../../types"

interface AdminDashboardProps {
  users: IAMUser[]
  roles: Role[]
  permissions: Permission[]
  onNavigateTab: (tab: AdminTab) => void
}

export default function AdminDashboard({
  users,
  roles,
  permissions,
  onNavigateTab,
}: AdminDashboardProps) {
  const activeUsers = users.filter((u) => u.status === "Active").length

  return (
    <div className="space-y-8">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0B132B] via-[#1E293B] to-[#1E3A8A] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-blue-300 backdrop-blur-xs mb-2">
              <span className="size-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>Hệ thống phân quyền Role-Based Access Control</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl text-white">
              Bảng điều khiển Quản trị & Phân quyền
            </h1>
            <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
              Tổng quan cấu hình 3 vai trò chính (Super Admin, Admin, User), danh mục quyền hạn chi tiết và tài khoản người dùng hoạt động.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-blue-500/25 active:scale-98"
            >
              + Tạo người dùng
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab("permissions")}
              className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition-all active:scale-98"
            >
              Xem quyền hạn
            </button>
          </div>
        </div>

        {/* Ambient background glow decoration */}
        <div className="pointer-events-none absolute -right-10 -bottom-10 size-60 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -top-10 size-40 rounded-full bg-purple-500/10 blur-2xl" />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Card 1: Users */}
        <div
          onClick={() => onNavigateTab("users")}
          className="group relative rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {activeUsers} Active
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tổng người dùng
            </span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{users.length}</p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-blue-600 group-hover:underline">
              Quản lý danh sách tài khoản →
            </span>
          </div>
        </div>

        {/* Card 2: Roles */}
        <div
          onClick={() => onNavigateTab("roles")}
          className="group relative rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
              3 Roles
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vai trò trong hệ thống
            </span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{roles.length}</p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-purple-600 group-hover:underline">
              Xem chi tiết 3 vai trò →
            </span>
          </div>
        </div>

        {/* Card 3: Permissions */}
        <div
          onClick={() => onNavigateTab("permissions")}
          className="group relative rounded-xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              CRUD Granular
            </span>
          </div>

          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quyền hạn (Permissions)
            </span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{permissions.length}</p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="font-semibold text-emerald-600 group-hover:underline">
              Xem danh mục quyền hạn →
            </span>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Recent Users & 3 Roles Mapping */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Column 1: Recent Users */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Người dùng gần đây</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Tài khoản được khởi tạo và phân quyền</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("users")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Xem tất cả ({users.length}) →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {users.slice(0, 5).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-700">
                    {u.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{u.userName}</p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{u.email}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      u.role === "Super Admin"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : u.role === "Admin"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {u.role}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {u.lastActivity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: 3 Roles Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">3 Vai trò cốt lõi (Core Roles)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Mô hình phân cấp quyền truy cập hệ thống</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("roles")}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Cấu hình vai trò →
            </button>
          </div>

          <div className="space-y-3">
            {roles.map((r) => {
              const badgeStyle =
                r.name === "Super Admin"
                  ? "border-purple-200 bg-purple-50/40"
                  : r.name === "Admin"
                    ? "border-blue-200 bg-blue-50/40"
                    : "border-emerald-200 bg-emerald-50/40"

              const titleColor =
                r.name === "Super Admin"
                  ? "text-purple-800"
                  : r.name === "Admin"
                    ? "text-blue-800"
                    : "text-emerald-800"

              return (
                <div
                  key={r.id}
                  className={`rounded-lg border p-4 transition-all hover:shadow-xs ${badgeStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <strong className={`text-xs font-bold ${titleColor}`}>
                        {r.name === "Super Admin" ? "★ " : ""}
                        {r.name}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {r.code}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-700">
                      {r.userCount} người dùng
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/50 pt-2">
                    <span className="font-semibold text-blue-700">
                      {r.permissions.length} quyền hạn tích hợp
                    </span>
                    <span className="font-mono text-slate-400">Tạo: {r.createdAt}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
