import { useState } from "react"
import type { Permission } from "../../types"

interface AdminPermissionsListProps {
  permissions: Permission[]
  onCreatePermission: (newPerm: Permission) => void
  onUpdatePermission: (updatedPerm: Permission) => void
  onDeletePermission: (permId: string) => void
}

export default function AdminPermissionsList({
  permissions,
  onCreatePermission,
  onUpdatePermission,
  onDeletePermission,
}: AdminPermissionsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("All")
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null)

  // Form states
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formCategory, setFormCategory] = useState<"Jobs" | "CV" | "Users" | "System">("Jobs")
  const [formError, setFormError] = useState("")

  const openCreateModal = () => {
    setModalMode("create")
    setEditingPermission(null)
    setFormName("")
    setFormCode("")
    setFormDesc("")
    setFormCategory("Jobs")
    setFormError("")
  }

  const openEditModal = (perm: Permission) => {
    setModalMode("edit")
    setEditingPermission(perm)
    setFormName(perm.name)
    setFormCode(perm.code)
    setFormDesc(perm.description)
    setFormCategory(perm.category)
    setFormError("")
  }

  const handleSave = () => {
    if (!formName.trim()) {
      setFormError("Vui lòng nhập tên quyền hạn.")
      return
    }
    if (!formCode.trim()) {
      setFormError("Vui lòng nhập mã quyền hạn (ví dụ: jobs:create).")
      return
    }

    if (modalMode === "create") {
      const newPerm: Permission = {
        id: `perm-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim().toLowerCase(),
        description: formDesc.trim() || "Mô tả quyền hạn",
        category: formCategory,
      }
      onCreatePermission(newPerm)
    } else if (modalMode === "edit" && editingPermission) {
      const updated: Permission = {
        ...editingPermission,
        name: formName.trim(),
        code: formCode.trim().toLowerCase(),
        description: formDesc.trim(),
        category: formCategory,
      }
      onUpdatePermission(updated)
    }

    setModalMode(null)
  }

  const filtered = permissions.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
              Quản lý Quyền hạn (Permissions)
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
              {permissions.length} quyền hạn
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Danh mục các quyền hạn chi tiết quy định từng hành động thao tác (CRUD) trên tài nguyên hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-blue-500/25 active:scale-98"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Thêm quyền hạn mới</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "All", label: "Tất cả" },
            { id: "Jobs", label: "Jobs (Việc làm)" },
            { id: "CV", label: "CV (Hồ sơ)" },
            { id: "Users", label: "Users (Người dùng)" },
            { id: "System", label: "System (Hệ thống)" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                categoryFilter === cat.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

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
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên quyền, mã code..."
            className="h-8.5 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
              <th className="px-4 py-3.5">Tên quyền hạn</th>
              <th className="px-4 py-3.5">Mã code (Identifier)</th>
              <th className="px-4 py-3.5">Phân hệ</th>
              <th className="px-4 py-3.5">Mô tả hành động</th>
              <th className="px-4 py-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-800">
            {filtered.map((perm) => (
              <tr key={perm.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3.5 font-bold text-slate-900">{perm.name}</td>
                <td className="px-4 py-3.5">
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                    {perm.code}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {perm.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[11px] text-slate-500 max-w-md leading-relaxed">
                  {perm.description}
                </td>
                <td className="px-4 py-3.5 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(perm)}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePermission(perm.id)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-slate-400">
                  Không tìm thấy quyền hạn nào phù hợp với từ khóa "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Permission Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {modalMode === "create" ? "Thêm quyền hạn mới" : "Chỉnh sửa quyền hạn"}
              </h2>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-800">Tên quyền hạn *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Xóa việc làm khỏi hệ thống"
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800">Mã quyền (Code) *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Ví dụ: jobs:delete, users:create"
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800">Phân hệ (Category)</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="Jobs">Jobs (Việc làm)</option>
                  <option value="CV">CV (Hồ sơ)</option>
                  <option value="Users">Users (Người dùng)</option>
                  <option value="System">System (Hệ thống)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-800">Mô tả hành động</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Mô tả chi tiết quyền hạn cho phép thực hiện..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {formError && (
                <p className="text-xs font-semibold text-red-600">{formError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-500 shadow-sm"
              >
                {modalMode === "create" ? "Tạo quyền hạn" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
