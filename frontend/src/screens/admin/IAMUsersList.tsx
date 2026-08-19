import { useState } from "react"
import type { IAMUser, Role } from "../../types"

interface IAMUsersListProps {
  users: IAMUser[]
  roles?: Role[]
  onCreateUser: () => void
  onSelectUser: (user: IAMUser) => void
  onDeleteUsers: (userIds: string[]) => void
}

export default function IAMUsersList({
  users,
  roles,
  onCreateUser,
  onSelectUser,
  onDeleteUsers,
}: IAMUsersListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("All")
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 350)
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.userName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "All" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const activePage = Math.min(currentPage, totalPages)
  const paginatedUsers = filteredUsers.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  )

  const isAllSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedUserIds.has(u.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedUserIds)
      paginatedUsers.forEach((u) => next.delete(u.id))
      setSelectedUserIds(next)
    } else {
      const next = new Set(selectedUserIds)
      paginatedUsers.forEach((u) => next.add(u.id))
      setSelectedUserIds(next)
    }
  }

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUserIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedUserIds(next)
  }

  const confirmDelete = () => {
    onDeleteUsers(Array.from(selectedUserIds))
    setSelectedUserIds(new Set())
    setIsDeletingModalOpen(false)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Super Admin":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] font-bold text-purple-700 shadow-2xs">
            ★ Super Admin
          </span>
        )
      case "Admin":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-blue-700 shadow-2xs">
            Admin
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-2xs">
            User
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
              Quản lý Người dùng & Phân quyền
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
              {users.length} tài khoản
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Quản lý danh sách tài khoản, chỉ định 1 trong 3 vai trò (Super Admin / Admin / User) và cấu hình quyền hạn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Làm mới danh sách"
          >
            <svg
              className={`size-3.5 ${isRefreshing ? "animate-spin text-blue-600" : "text-slate-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            disabled={selectedUserIds.size === 0}
            onClick={() => setIsDeletingModalOpen(true)}
            className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
          >
            Xóa {selectedUserIds.size > 0 ? `(${selectedUserIds.size})` : ""}
          </button>

          <button
            type="button"
            onClick={onCreateUser}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-98"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Tạo người dùng mới</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Role Filter Tabs & Search Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: "All", label: "Tất cả vai trò" },
              ...(roles
                ? roles.map((r) => ({ id: r.name, label: r.name }))
                : [
                  { id: "Super Admin", label: "Super Admin" },
                  { id: "Admin", label: "Admin" },
                  { id: "User", label: "User" },
                ]),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setRoleFilter(tab.id)
                  setCurrentPage(1)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${roleFilter === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-xs">
            <svg
              className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm kiếm tài khoản, email..."
              className="h-8.5 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th className="px-4 py-3.5">Tài khoản (User)</th>
                <th className="px-4 py-3.5">Vai trò (Role)</th>
                <th className="px-4 py-3.5">Quyền hạn được cấp</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Hoạt động gần nhất</th>
                <th className="px-4 py-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
              {paginatedUsers.map((u) => {
                const isSelected = selectedUserIds.has(u.id)
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors hover:bg-slate-50/80 ${isSelected ? "bg-blue-50/40" : ""
                      }`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(u.id)}
                        className="size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Chọn ${u.userName || u.email}`}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 font-bold text-xs text-slate-700 shadow-2xs">
                          {(u.userName || u.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectUser(u)}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-left block leading-tight"
                          >
                            {u.userName || "Chưa có tên"}
                          </button>
                          <span className="text-[11px] text-slate-400 leading-tight mt-0.5 block">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(u.customPermissions || []).slice(0, 3).map((code) => (
                          <span
                            key={code}
                            className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono text-slate-700"
                            title={code}
                          >
                            {code}
                          </span>
                        ))}
                        {(u.customPermissions || []).length > 3 && (
                          <span className="inline-flex items-center rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                            +{(u.customPermissions || []).length - 3} quyền
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500 font-mono">
                      {u.lastActivity}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectUser(u)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                      >
                        Quản lý →
                      </button>
                    </td>
                  </tr>
                )
              })}

              {paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200 p-4 bg-slate-50/50 text-xs text-slate-500">
          <span>
            {filteredUsers.length === 0
              ? "0 kết quả"
              : `Hiển thị ${(activePage - 1) * pageSize + 1}–${Math.min(activePage * pageSize, filteredUsers.length)} trong số ${filteredUsers.length} tài khoản`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="flex size-7.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            <span className="flex size-7.5 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-xs">
              {activePage}
            </span>
            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="flex size-7.5 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeletingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex size-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xác nhận xóa {selectedUserIds.size} người dùng?
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                Tài khoản được chọn sẽ bị thu hồi toàn bộ quyền đăng nhập và quyền hạn trên hệ thống JobMatch.
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeletingModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-sm"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
