import { useState } from "react"
import type { Role, Permission } from "../../types"

interface AdminRolesListProps {
  roles: Role[]
  permissions: Permission[]
  onCreateRole: () => void
  onDeleteRole: (roleId: string) => void
}

export default function AdminRolesList({
  roles,
  permissions,
  onCreateRole,
  onDeleteRole,
}: AdminRolesListProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] || null)

  const getRoleTheme = (name: string) => {
    switch (name) {
      case "Super Admin":
        return {
          border: "border-purple-200 hover:border-purple-400",
          selectedBg: "border-purple-600 bg-purple-50/40 shadow-xs",
          badge: "bg-purple-50 text-purple-700 border-purple-200",
          iconBg: "bg-purple-600 text-white",
        }
      case "Admin":
        return {
          border: "border-blue-200 hover:border-blue-400",
          selectedBg: "border-blue-600 bg-blue-50/40 shadow-xs",
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          iconBg: "bg-blue-600 text-white",
        }
      default:
        return {
          border: "border-emerald-200 hover:border-emerald-400",
          selectedBg: "border-emerald-600 bg-emerald-50/40 shadow-xs",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          iconBg: "bg-emerald-600 text-white",
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
              Quản lý Vai trò (Roles)
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              3 Vai trò cốt lõi
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Hệ thống phân cấp 3 vai trò chuẩn: <strong>Super Admin</strong>, <strong>Admin</strong> và <strong>User</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateRole}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-98"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Tạo vai trò mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left Column: Role Selector Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Danh sách vai trò ({roles.length})
          </h2>

          <div className="space-y-3">
            {roles.map((role) => {
              const isSelected = selectedRole?.id === role.id
              const theme = getRoleTheme(role.name)
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-xl border p-4.5 cursor-pointer transition-all ${
                    isSelected
                      ? theme.selectedBg
                      : `bg-white ${theme.border} hover:shadow-xs`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex size-7 items-center justify-center rounded-lg text-xs font-bold ${theme.iconBg}`}>
                        {role.name.charAt(0)}
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block leading-tight">
                          {role.name}
                        </strong>
                        <span className="font-mono text-[10px] text-slate-400 block leading-tight mt-0.5">
                          {role.code}
                        </span>
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                      {role.userCount} users
                    </span>
                  </div>

                  <p className="mt-2.5 text-[11px] text-slate-600 leading-relaxed">
                    {role.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px]">
                    <span className="font-bold text-blue-600">
                      {role.permissions.length} quyền hạn gán
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {role.createdAt}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Role Details & Permissions */}
        {selectedRole && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            {/* Header info */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    {selectedRole.name}
                  </h2>
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 font-mono text-xs text-slate-700">
                    {selectedRole.code}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed max-w-xl">
                  {selectedRole.description}
                </p>
              </div>

              {selectedRole.code !== "super_admin" && (
                <button
                  type="button"
                  onClick={() => onDeleteRole(selectedRole.id)}
                  className="rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700 transition-colors"
                >
                  Xóa vai trò
                </button>
              )}
            </div>

            {/* Attached Permissions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Danh sách quyền hạn của vai trò ({selectedRole.permissions.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {selectedRole.permissions.map((permCode) => {
                  const perm = permissions.find((p) => p.code === permCode)
                  return (
                    <div
                      key={permCode}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-2 rounded-full bg-blue-500" />
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {perm?.name || permCode}
                          </span>
                          <span className="font-mono text-[11px] text-blue-600 block leading-tight mt-0.5">
                            {permCode}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {perm?.category || "Quyền hạn"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
