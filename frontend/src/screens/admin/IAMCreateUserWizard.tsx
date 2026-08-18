import { useState } from "react"
import type { IAMUser, Role, Permission } from "../../types"

interface IAMCreateUserWizardProps {
  roles: Role[]
  permissions: Permission[]
  onCancel: () => void
  onCreateUser: (newUser: IAMUser) => void
}

export default function IAMCreateUserWizard({
  roles,
  permissions,
  onCancel,
  onCreateUser,
}: IAMCreateUserWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1 State
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [consoleAccess, setConsoleAccess] = useState(true)
  const [password, setPassword] = useState("JobMatch@2026")
  const [userNameError, setUserNameError] = useState("")

  // Step 2 State - Default to first role or "User"
  const defaultRole = roles.find((r) => r.name === "User") || roles[0]
  const [selectedRole, setSelectedRole] = useState<string>(defaultRole ? defaultRole.name : "User")
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(defaultRole ? defaultRole.permissions : []),
  )
  const [permSearch, setPermSearch] = useState("")

  const handleRoleChange = (roleName: string) => {
    setSelectedRole(roleName)
    const roleObj = roles.find((r) => r.name === roleName)
    if (roleObj) {
      setSelectedPermissions(new Set(roleObj.permissions))
    }
  }

  const togglePermission = (code: string) => {
    const next = new Set(selectedPermissions)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    setSelectedPermissions(next)
  }

  const handleStep1Next = () => {
    const trimmed = userName.trim()
    if (!trimmed) {
      setUserNameError("Vui lòng nhập tên người dùng.")
      return
    }
    if (!/^[a-zA-Z0-9+=,.@_-]+$/.test(trimmed)) {
      setUserNameError("Tên người dùng chỉ được chứa ký tự chữ cái, chữ số và +=,.@_-")
      return
    }
    setUserNameError("")
    setCurrentStep(2)
  }

  const handleFinishCreate = () => {
    const newUser: IAMUser = {
      id: `usr-${Date.now()}`,
      userName: userName.trim(),
      email: email.trim() || `${userName.trim().toLowerCase()}@jobmatch.ai`,
      path: selectedRole === "Super Admin" ? "/" : `/${selectedRole.toLowerCase().replace(/\s+/g, "-")}/`,
      role: selectedRole,
      customPermissions: Array.from(selectedPermissions),
      consoleAccess,
      status: "Active",
      lastActivity: "Vừa xong",
      createdAt: new Date().toLocaleDateString("vi-VN"),
    }

    onCreateUser(newUser)
  }

  const filteredPerms = permissions.filter(
    (p) =>
      p.name.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(permSearch.toLowerCase()),
  )

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      {/* Left Stepper */}
      <nav aria-label="Các bước tạo người dùng" className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-4">
            Quy trình khởi tạo
          </span>

          <ol className="space-y-4 text-xs">
            {/* Step 1 */}
            <li className="flex items-start gap-3">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentStep === 1
                    ? "bg-blue-600 text-white shadow-xs"
                    : currentStep > 1
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                      : "border border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </span>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 leading-tight">
                  Bước 1
                </span>
                <span
                  className={`font-semibold leading-tight mt-0.5 block ${
                    currentStep === 1 ? "text-blue-600 font-bold" : "text-slate-700"
                  }`}
                >
                  Thông tin người dùng
                </span>
              </div>
            </li>

            {/* Step 2 */}
            <li className="flex items-start gap-3">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentStep === 2
                    ? "bg-blue-600 text-white shadow-xs"
                    : currentStep > 2
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold"
                      : "border border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </span>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 leading-tight">
                  Bước 2
                </span>
                <span
                  className={`font-semibold leading-tight mt-0.5 block ${
                    currentStep === 2 ? "text-blue-600 font-bold" : "text-slate-700"
                  }`}
                >
                  Gán vai trò & Quyền hạn
                </span>
              </div>
            </li>

            {/* Step 3 */}
            <li className="flex items-start gap-3">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  currentStep === 3
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200 bg-slate-50 text-slate-400"
                }`}
              >
                3
              </span>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 leading-tight">
                  Bước 3
                </span>
                <span
                  className={`font-semibold leading-tight mt-0.5 block ${
                    currentStep === 3 ? "text-blue-600 font-bold" : "text-slate-700"
                  }`}
                >
                  Xem lại & Hoàn tất
                </span>
              </div>
            </li>
          </ol>
        </div>
      </nav>

      {/* Right Content Panels */}
      <div className="space-y-6">
        {/* ================= STEP 1 ================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
                Chỉ định thông tin tài khoản
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Thiết lập tên tài khoản, địa chỉ email và quyền truy cập vào hệ thống.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Chi tiết người dùng
              </h2>

              <div>
                <label
                  htmlFor="user-name-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Tên người dùng (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value)
                    if (userNameError) setUserNameError("")
                  }}
                  placeholder="Ví dụ: tuannm, dev.lead, admin.ops"
                  className={`mt-1.5 h-9 w-full max-w-lg rounded-lg border bg-white px-3 text-xs text-slate-900 outline-none transition-all ${
                    userNameError
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Tối đa 64 ký tự. Chấp nhận các ký tự: chữ cái, chữ số, and +=,.@_-
                </p>
                {userNameError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    {userNameError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Địa chỉ Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuannm@gmail.com"
                  className="mt-1.5 h-9 w-full max-w-lg rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consoleAccess}
                    onChange={(e) => setConsoleAccess(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Cung cấp quyền đăng nhập giao diện web (Console Access)
                  </span>
                </label>
              </div>

              {consoleAccess && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800">
                    Mật khẩu ban đầu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 h-9 w-full max-w-lg rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              )}
            </div>

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
                onClick={handleStep1Next}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
              >
                Tiếp theo →
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2 ================= */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
                Gán vai trò & Quyền hạn
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Chọn một trong các vai trò hiện có trong hệ thống ({roles.length} vai trò) và tùy chọn cấp thêm quyền hạn trực tiếp.
              </p>
            </div>

            {/* Role Selection */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  1. Chọn vai trò (Role) ({roles.length} vai trò khả dụng)
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {roles.map((r) => {
                  const isSelected = selectedRole === r.name
                  return (
                    <div
                      key={r.id}
                      onClick={() => handleRoleChange(r.name)}
                      className={`rounded-xl border p-4.5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/40 shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-900">{r.name}</strong>
                        <input
                          type="radio"
                          name="role-select"
                          checked={isSelected}
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

            {/* Custom Permissions table */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    2. Quyền hạn trực tiếp (Đã chọn {selectedPermissions.size} quyền)
                  </h2>
                </div>
                <input
                  type="search"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Lọc quyền theo tên, mã..."
                  className="h-8.5 w-64 rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-500">
                      <th className="w-10 px-3.5 py-3 text-center"></th>
                      <th className="px-3.5 py-3">Tên quyền hạn</th>
                      <th className="px-3.5 py-3">Mã code</th>
                      <th className="px-3.5 py-3">Phân hệ</th>
                      <th className="px-3.5 py-3">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPerms.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.code)
                      return (
                        <tr
                          key={perm.id}
                          className={`hover:bg-slate-50/70 cursor-pointer ${
                            isChecked ? "bg-blue-50/30" : ""
                          }`}
                          onClick={() => togglePermission(perm.code)}
                        >
                          <td
                            className="px-3.5 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(perm.code)}
                              className="size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3.5 py-3 font-bold text-slate-900">{perm.name}</td>
                          <td className="px-3.5 py-3 font-mono font-semibold text-blue-600">
                            {perm.code}
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {perm.category}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-[11px] text-slate-500 leading-relaxed">
                            {perm.description}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Quay lại
              </button>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
                >
                  Tiếp theo →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3 ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl">
                Xem lại & Hoàn tất tạo người dùng
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Kiểm tra lại toàn bộ thông tin tài khoản và phân quyền trước khi khởi tạo.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Tóm tắt cấu hình tài khoản
              </h2>

              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-slate-400">Tên người dùng</dt>
                  <dd className="mt-1 font-bold text-slate-900">{userName}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="mt-1 font-medium text-slate-700">{email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Vai trò chính</dt>
                  <dd className="mt-1 font-bold text-blue-600">{selectedRole}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Quyền đăng nhập Console</dt>
                  <dd className="mt-1 font-semibold text-emerald-700">
                    {consoleAccess ? "Bật" : "Tắt"}
                  </dd>
                </div>
              </dl>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-800 mb-2">
                  Danh sách quyền hạn được cấp ({selectedPermissions.size}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedPermissions).map((code) => (
                    <span
                      key={code}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-700"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Quay lại
              </button>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleFinishCreate}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500"
                >
                  Xác nhận tạo người dùng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
