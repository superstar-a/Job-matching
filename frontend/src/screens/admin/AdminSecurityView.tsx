import { useState } from "react"

export default function AdminSecurityView() {
  const [mfaEnforced, setMfaEnforced] = useState(true)
  const [minPasswordLength, setMinPasswordLength] = useState(12)
  const [requireSymbols, setRequireSymbols] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [savedNotice, setSavedNotice] = useState(false)

  const handleSave = () => {
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">
          Cài đặt Bảo mật & Chính sách Xác thực
        </h1>
        <p className="mt-1 text-xs text-muted-ink">
          Thiết lập tiêu chuẩn bảo mật mật khẩu, xác thực đa yếu tố (MFA) và thời hạn phiên làm việc cho toàn hệ thống.
        </p>
      </div>

      {savedNotice && (
        <div className="rounded-[4px] border border-emerald-500/30 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-xs">
          <span>✓ Đã lưu cấu hình bảo mật thành công!</span>
        </div>
      )}

      {/* Card 1: Password Policy */}
      <div className="rounded-[6px] border border-rule bg-paper p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-ink border-b border-rule pb-3">
          Chính sách Mật khẩu (Password Policy)
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink">
              Độ dài mật khẩu tối thiểu ({minPasswordLength} ký tự)
            </label>
            <input
              type="range"
              min={8}
              max={24}
              value={minPasswordLength}
              onChange={(e) => setMinPasswordLength(Number(e.target.value))}
              className="mt-2 w-full max-w-md accent-cobalt"
            />
          </div>

          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requireSymbols}
                onChange={(e) => setRequireSymbols(e.target.checked)}
                className="size-4 rounded border-rule text-cobalt focus:ring-cobalt"
              />
              <span className="font-semibold text-ink">
                Yêu cầu ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt (@, #, $, %)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Card 2: MFA & Sessions */}
      <div className="rounded-[6px] border border-rule bg-paper p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-ink border-b border-rule pb-3">
          Xác thực đa yếu tố & Phiên đăng nhập
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={mfaEnforced}
                onChange={(e) => setMfaEnforced(e.target.checked)}
                className="mt-0.5 size-4 rounded border-rule text-cobalt focus:ring-cobalt"
              />
              <div>
                <span className="font-semibold text-ink">
                  Bắt buộc bật xác thực 2 lớp (MFA) cho tài khoản Quản trị viên
                </span>
                <p className="text-[11px] text-muted-ink mt-0.5">
                  Tài khoản có quyền quản trị hệ thống (Admin) phải quét mã Authenticator khi đăng nhập.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-ink">
              Thời gian tự động đăng xuất khi không hoạt động
            </label>
            <select
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Number(e.target.value))}
              className="focus-ring mt-1.5 h-9 rounded-[4px] border border-rule bg-paper px-3 text-xs text-ink outline-none"
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={60}>60 phút (Mặc định)</option>
              <option value={120}>2 giờ</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-[4px] bg-cobalt px-6 py-2 text-xs font-semibold text-white shadow-xs hover:bg-cobalt/90 active:bg-cobalt/80"
        >
          Lưu cài đặt bảo mật
        </button>
      </div>
    </div>
  )
}
