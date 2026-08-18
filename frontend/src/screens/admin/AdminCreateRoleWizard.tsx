import { useState } from "react"
import type { Role, Permission } from "../../types"

interface AdminCreateRoleWizardProps {
  permissions: Permission[]
  onCancel: () => void
  onCreateRole: (newRole: Role) => void
}

export default function AdminCreateRoleWizard({
  permissions,
  onCancel,
  onCreateRole,
}: AdminCreateRoleWizardProps) {
  const [roleName, setRoleName] = useState("")
  const [roleCode, setRoleCode] = useState("")
  const [description, setDescription] = useState("")
  const [selectedPermCodes, setSelectedPermCodes] = useState<Set<string>>(
    new Set(["jobs:read", "cv:read_self", "cv:analyze"]),
  )
  const [permSearch, setPermSearch] = useState("")
  const [formError, setFormError] = useState("")

  const togglePerm = (code: string) => {
    const next = new Set(selectedPermCodes)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    setSelectedPermCodes(next)
  }

  const handleCreate = () => {
    if (!roleName.trim()) {
      setFormError("Vui lòng nhập tên vai trò (Role name).")
      return
    }
    if (!roleCode.trim()) {
      setFormError("Vui lòng nhập mã định danh vai trò (Role code).")
      return
    }

    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: roleName.trim(),
      code: roleCode.trim().toLowerCase().replace(/\s+/g, "_"),
      description: description.trim() || `Vai trò ${roleName.trim()}`,
      permissions: Array.from(selectedPermCodes),
      userCount: 0,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    }

    onCreateRole(newRole)
  }

  const filteredPerms = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(permSearch.toLowerCase()),
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
          Tạo vai trò mới (Create Role)
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Thiết lập tên vai trò và tập hợp các quyền hạn cho phép thực thi trên hệ thống.
        </p>
      </div>

      {/* Role Info Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Thông tin vai trò
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-800">Tên vai trò *</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => {
                setRoleName(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Ví dụ: Content Moderator, Support Lead"
              className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800">Mã vai trò (Role code) *</label>
            <input
              type="text"
              value={roleCode}
              onChange={(e) => {
                setRoleCode(e.target.value)
                if (formError) setFormError("")
              }}
              placeholder="Ví dụ: content_mod, support_lead"
              className="mt-1.5 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-semibold text-slate-800">Mô tả vai trò</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả phạm vi quyền hạn của vai trò này..."
            className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {formError && (
          <p className="text-xs font-semibold text-red-600">{formError}</p>
        )}
      </div>

      {/* Permissions Selector Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Gán quyền hạn (Đã chọn {selectedPermCodes.size} quyền)
          </h2>
          <input
            type="search"
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            placeholder="Lọc quyền hạn theo tên, mã..."
            className="h-8.5 w-64 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                <th className="w-10 px-3.5 py-2.5 text-center"></th>
                <th className="px-3.5 py-2.5">Tên quyền hạn</th>
                <th className="px-3.5 py-2.5">Mã code</th>
                <th className="px-3.5 py-2.5">Phân hệ</th>
                <th className="px-3.5 py-2.5">Mô tả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPerms.map((p) => {
                const isChecked = selectedPermCodes.has(p.code)
                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/70 cursor-pointer ${
                      isChecked ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => togglePerm(p.code)}
                  >
                    <td
                      className="px-3.5 py-2.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePerm(p.code)}
                        className="size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900">{p.name}</td>
                    <td className="px-3.5 py-2.5 font-mono font-semibold text-blue-600">
                      {p.code}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 text-[11px] text-slate-500 leading-relaxed">
                      {p.description}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Hủy bỏ
        </button>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
        >
          Xác nhận tạo vai trò
        </button>
      </div>
    </div>
  )
}
