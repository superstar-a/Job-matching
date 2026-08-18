import { useState } from "react"
import type { IAMUser, Role, Permission } from "../../types"

interface IAMUserDetailProps {
  user: IAMUser
  roles: Role[]
  permissions: Permission[]
  onBack: () => void
  onUpdateUser: (updatedUser: IAMUser) => void
}

export default function IAMUserDetail({
  user,
  roles,
  permissions,
  onBack,
  onUpdateUser,
}: IAMUserDetailProps) {
  const [activeTab, setActiveTab] = useState<"permissions" | "role">("permissions")
  const [isAddPermModalOpen, setIsAddPermModalOpen] = useState(false)
  const [permSearch, setPermSearch] = useState("")

  const handleRoleChange = (newRole: string) => {
    const roleObj = roles.find((r) => r.name === newRole)
    const updated: IAMUser = {
      ...user,
      role: newRole,
      customPermissions: roleObj ? roleObj.permissions : user.customPermissions,
    }
    onUpdateUser(updated)
  }

  const handleRemovePermission = (code: string) => {
    const updated: IAMUser = {
      ...user,
      customPermissions: user.customPermissions.filter((p) => p !== code),
    }
    onUpdateUser(updated)
  }

  const handleAddPermission = (code: string) => {
    if (user.customPermissions.includes(code)) return
    const updated: IAMUser = {
      ...user,
      customPermissions: [...user.customPermissions, code],
    }
    onUpdateUser(updated)
    setIsAddPermModalOpen(false)
  }

  const availablePerms = permissions.filter(
    (p) =>
      !user.customPermissions.includes(p.code) &&
      (p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(permSearch.toLowerCase())),
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "Admin":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "User":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
                {user.userName}
              </h1>
              <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400 font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      {/* User Summary Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Tổng quan tài khoản
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
          <div>
            <dt className="text-slate-400">Trạng thái</dt>
            <dd className="mt-1 flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" />
              {user.status}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Hoạt động gần nhất</dt>
            <dd className="mt-1 font-mono text-slate-700">{user.lastActivity}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Truy cập Console</dt>
            <dd className="mt-1 font-semibold text-slate-900">
              {user.consoleAccess ? "Được phép" : "Chỉ API"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Ngày tạo</dt>
            <dd className="mt-1 text-slate-500">{user.createdAt}</dd>
          </div>
        </dl>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`border-b-2 py-2.5 text-xs font-bold transition-all ${
              activeTab === "permissions"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Quyền hạn trực tiếp ({user.customPermissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("role")}
            className={`border-b-2 py-2.5 text-xs font-bold transition-all ${
              activeTab === "role"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Thay đổi Vai trò ({roles.length} vai trò)
          </button>
        </nav>
      </div>

      {/* Tab 1: Permissions List */}
      {activeTab === "permissions" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Danh sách quyền hạn được gán
            </h3>
            <button
              type="button"
              onClick={() => setIsAddPermModalOpen(true)}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all active:scale-98"
            >
              + Thêm quyền hạn
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            {user.customPermissions.map((code) => {
              const perm = permissions.find((p) => p.code === code)
              return (
                <div
                  key={code}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50/70 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-blue-500" />
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {perm?.name || code}
                      </span>
                      <span className="font-mono text-[11px] text-blue-600 block leading-tight mt-0.5">{code}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePermission(code)}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Gỡ quyền
                  </button>
                </div>
              )
            })}

            {user.customPermissions.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                Người dùng chưa được gán quyền hạn nào.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Role Switcher */}
      {activeTab === "role" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
            Chọn vai trò chính cho tài khoản ({roles.length} vai trò)
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {roles.map((r) => {
              const isCurrent = user.role === r.name
              return (
                <div
                  key={r.id}
                  onClick={() => handleRoleChange(r.name)}
                  className={`rounded-xl border p-4.5 cursor-pointer transition-all ${
                    isCurrent
                      ? "border-blue-600 bg-blue-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-900">{r.name}</strong>
                    <input
                      type="radio"
                      name="role-switch"
                      checked={isCurrent}
                      onChange={() => handleRoleChange(r.name)}
                      className="size-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                    {r.description}
                  </p>
                  <span className="mt-3 inline-block font-mono text-[10px] text-blue-600 font-bold">
                    {r.permissions.length} quyền mặc định
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Permission Modal */}
      {isAddPermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Thêm quyền hạn cho người dùng</h2>
              <button
                type="button"
                onClick={() => setIsAddPermModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <input
              type="search"
              value={permSearch}
              onChange={(e) => setPermSearch(e.target.value)}
              placeholder="Tìm kiếm quyền hạn..."
              className="h-8.5 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {availablePerms.map((perm) => (
                <div
                  key={perm.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{perm.name}</span>
                    <span className="font-mono text-[11px] text-blue-600">{perm.code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddPermission(perm.code)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-white hover:bg-blue-500"
                  >
                    Gán quyền
                  </button>
                </div>
              ))}

              {availablePerms.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Không còn quyền hạn nào khả dụng để gán.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsAddPermModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
