import { useEffect, useRef } from "react"
import type { Screen } from "../types"
import { authApi } from "../api/authApi"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (screen: Screen) => void
  onLogout?: () => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  onNavigate,
  onLogout,
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLogout = async () => {
    onClose()
    if (onLogout) {
      onLogout()
    } else {
      await authApi.logout()
      onNavigate("auth")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rule bg-paper p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule pb-4">
          <div>
            <p className="editorial-kicker">Tuỳ chọn</p>
            <h2
              id="settings-modal-title"
              className="font-editorial text-2xl font-bold text-ink"
            >
              Cài đặt
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex size-9 items-center justify-center rounded-full border border-rule text-muted-ink hover:border-ink hover:text-ink transition-colors"
            aria-label="Đóng"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 py-5">
          {/* User Account Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-rule/80 bg-porcelain p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-cobalt font-editorial text-sm font-bold text-white shadow-sm">
              NT
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">
                Nguyễn Minh Tuấn
              </p>
              <p className="truncate text-xs text-muted-ink">
                tuannm@gmail.com
              </p>
              <span className="mt-1 inline-flex items-center rounded-full bg-sage/60 px-2 py-0.5 text-[10px] font-semibold text-[#27633B]">
                Tài khoản Pro
              </span>
            </div>
          </div>

          {/* Settings Options */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-ink">
              Tài khoản & Hệ thống
            </h3>
            <div className="divide-y divide-rule/60 rounded-xl border border-rule/70 bg-paper">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onNavigate("profile")
                }}
                className="flex w-full items-center justify-between p-3.5 text-left text-xs font-semibold text-ink hover:bg-porcelain transition-colors"
              >
                <span>Hồ sơ nghề nghiệp & CV</span>
                <span className="text-muted-ink">→</span>
              </button>
              <div className="flex items-center justify-between p-3.5 text-xs font-semibold text-ink">
                <span>Ngôn ngữ giao diện</span>
                <span className="text-xs text-muted-ink">Tiếng Việt</span>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-2 border-t border-rule">
            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-100 hover:border-red-300 active:scale-[0.99]"
            >
              <svg
                className="size-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
