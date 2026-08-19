import { useEffect, useRef, useState } from "react"

import type { Job, Screen } from "../types"

interface SidebarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen, job?: Job | null) => void
  isCollapsed: boolean
  onToggle: () => void
  isCvUploaded: boolean
  currentUser?: { name: string; email: string; role?: string } | null
  onLogout?: () => void
}

const NAV_GROUPS = [
  {
    label: "Không gian làm việc",
    items: [
      { id: "copilot" as Screen, label: "Phiên tư vấn mới", icon: ChatIcon },
      { id: "explore" as Screen, label: "Khám phá việc làm", icon: SearchIcon },
      {
        id: "saved" as Screen,
        label: "Việc làm đã lưu",
        icon: BookmarkIcon,
        badge: 4,
      },
    ],
  },
  {
    label: "Hồ sơ nghề nghiệp",
    items: [
      { id: "profile" as Screen, label: "Hồ sơ & CV", icon: UserIcon },
      { id: "cv-editor" as Screen, label: "CV theo từng việc", icon: EditIcon },
    ],
  },
  {
    label: "Gần đây",
    items: [
      {
        id: "chat-1" as Screen,
        label: "Phân tích JD Senior React",
        icon: HistoryIcon,
      },
      { id: "chat-2" as Screen, label: "Sửa CV cho VNG", icon: HistoryIcon },
      { id: "chat-3" as Screen, label: "Tìm việc Remote", icon: HistoryIcon },
    ],
  },
]

export default function Sidebar({
  currentScreen,
  onNavigate,
  isCollapsed,
  onToggle,
  isCvUploaded,
  currentUser,
  onLogout,
}: SidebarProps) {
  const displayName = currentUser?.name || currentUser?.email?.split("@")[0] || "Nguyễn M. Tuấn"
  const displayEmail = currentUser?.email || "tuannm@gmail.com"
  const userInitials = displayName.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase() || "NT"

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileDrawerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const sidebarWidth = isCollapsed
    ? "w-[72px] min-w-[72px]"
    : "w-[72px] min-w-[72px] md:w-[248px] md:min-w-[248px]"
  const itemLayout = isCollapsed
    ? "justify-center"
    : "justify-center md:justify-start md:gap-3 md:px-3"

  // Close dropup menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false)
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isUserMenuOpen])

  useEffect(() => {
    if (!isMobileNavOpen) return

    const drawer = mobileDrawerRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const focusable = drawer?.querySelectorAll<HTMLButtonElement>(
      "button:not([disabled])",
    )
    focusable?.[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setIsMobileNavOpen(false)
        return
      }

      if (event.key !== "Tab" || !focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previouslyFocused?.focus()
    }
  }, [isMobileNavOpen])

  const navigateFromMobile = (screen: Screen, job?: Job | null) => {
    setIsMobileNavOpen(false)
    onNavigate(screen, job)
  }

  return (
    <>
      <aside
        className={`relative sticky top-0 z-40 flex h-dvh flex-col overflow-visible border-r border-white/12 bg-ink text-white transition-[width,min-width] duration-300 ${sidebarWidth}`}
      >
        <div className="sidebar-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <div className="h-[72px] shrink-0 border-b border-white/12">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="focus-ring flex h-full w-full flex-col items-center justify-center gap-1 text-white md:hidden"
              aria-label="Mở menu điều hướng"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <MenuIcon />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em]">
                Menu
              </span>
            </button>

            <div className="hidden h-full items-center px-4 md:flex">
              <div className="flex size-8 shrink-0 items-center justify-center border border-white/30 text-[10px] font-bold tracking-[0.16em] text-white">
                JM
              </div>
              {!isCollapsed && (
                <div className="ml-3 min-w-0">
                  <div className="text-[13px] font-bold tracking-[-0.025em] text-white">
                    JobMatch
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Career studio
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 px-3 py-4">
            <button
              onClick={() => onNavigate("copilot")}
              className={`focus-ring flex min-h-11 w-full items-center border border-cobalt bg-cobalt text-left text-xs font-bold tracking-[0.01em] text-white transition-colors hover:bg-white hover:text-ink ${itemLayout}`}
              aria-label="Tạo phiên tư vấn mới"
              title={isCollapsed ? "Tạo phiên tư vấn mới" : undefined}
            >
              <PlusIcon />
              {!isCollapsed && (
                <span className="hidden md:inline">Phiên tư vấn mới</span>
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 pb-4" aria-label="Điều hướng chính">
            {NAV_GROUPS.map((group) => (
              <section key={group.label} className="mb-6 last:mb-0">
                {!isCollapsed && (
                  <h2 className="mb-1 hidden px-3 text-[9px] font-bold uppercase leading-6 tracking-[0.16em] text-white/50 md:block">
                    {group.label}
                  </h2>
                )}
                <div
                  className={`my-3 justify-center ${
                    isCollapsed ? "flex" : "flex md:hidden"
                  }`}
                  aria-hidden="true"
                >
                  <div className="h-px w-5 bg-white/20" />
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = currentScreen === item.id
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          onNavigate(
                            item.id,
                            item.id === "cv-editor" ? null : undefined,
                          )
                        }
                        className={`nav-item focus-ring relative flex min-h-11 w-full items-center text-left text-[13px] font-medium transition-colors before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-cobalt before:content-[''] hover:bg-white/8 hover:text-white ${itemLayout} ${
                          isActive
                            ? "text-white before:block"
                            : "text-white/62 before:hidden"
                        }`}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <span className="shrink-0" aria-hidden="true">
                          <Icon />
                        </span>
                        {!isCollapsed && (
                          <span className="hidden min-w-0 flex-1 truncate md:block">
                            {item.label}
                          </span>
                        )}
                        {"badge" in item &&
                          item.badge &&
                          (isCollapsed ? (
                            <span
                              className="absolute right-2 top-2 size-1.5 rounded-full bg-cobalt ring-2 ring-ink"
                              aria-label={`${item.badge} việc làm đã lưu`}
                            />
                          ) : (
                            <>
                              <span
                                className="absolute right-2 top-2 size-1.5 rounded-full bg-cobalt ring-2 ring-ink md:hidden"
                                aria-label={`${item.badge} việc làm đã lưu`}
                              />
                              <span className="hidden shrink-0 border border-white/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white md:inline">
                                {item.badge}
                              </span>
                            </>
                          ))}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </nav>

          {/* User Profile Bar + Dropup Popover (Cursor / Claude style) */}
          <div className="relative shrink-0 border-t border-white/12 p-2" ref={userMenuRef}>
            {/* Floating Dropup Menu */}
            {isUserMenuOpen && (
              <div
                className={`absolute bottom-full mb-2 z-50 rounded-2xl border border-white/15 bg-[#1e1e1e] p-2 text-white shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 ${
                  isCollapsed ? "left-2 w-64" : "left-2 right-2 min-w-[220px]"
                }`}
                role="menu"
              >
                {/* Header User */}
                <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-2 mb-1.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-[11px] font-bold text-white shadow-sm">
                    {userInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-white/50">
                      {displayEmail}
                    </p>
                  </div>
                </div>

                <div className="my-1 border-t border-white/10" />

                {/* Menu items */}
                <div className="space-y-0.5 text-xs font-medium">
                  {/* Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      onNavigate("profile")
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="size-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Cài đặt & Hồ sơ</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">Ctrl+,</span>
                  </button>

                  <div className="my-1 border-t border-white/10" />

                  {/* Log out */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false)
                      if (onLogout) onLogout()
                      else onNavigate("auth")
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-colors text-left font-semibold cursor-pointer"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Profile Bar Trigger */}
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`focus-ring flex min-h-11 w-full items-center rounded-xl p-2 transition-colors hover:bg-white/10 ${
                isCollapsed ? "justify-center" : "justify-between"
              } ${isUserMenuOpen ? "bg-white/10" : ""}`}
              aria-label="Menu tài khoản"
              aria-expanded={isUserMenuOpen}
              title={isCollapsed ? `${displayName} (Menu tài khoản)` : undefined}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-xs font-bold text-white shadow-sm">
                  {userInitials}
                </div>
                {!isCollapsed && (
                  <span className="truncate text-xs font-semibold text-white">
                    {displayName}
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <svg
                  className={`size-3.5 text-white/50 transition-transform duration-200 ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="focus-ring absolute top-3 -right-[22px] z-50 hidden size-11 items-center justify-center border border-rule bg-paper text-ink shadow-sm transition-colors hover:border-cobalt hover:text-cobalt md:flex"
          aria-label={
            isCollapsed
              ? "Mở rộng thanh điều hướng"
              : "Thu gọn thanh điều hướng"
          }
          title={
            isCollapsed
              ? "Mở rộng thanh điều hướng"
              : "Thu gọn thanh điều hướng"
          }
        >
          <svg
            width="15"
            height="15"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15 19-7-7 7-7"
            />
          </svg>
        </button>
      </aside>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Đóng menu điều hướng"
            tabIndex={-1}
          />
          <div
            ref={mobileDrawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu điều hướng"
            className="relative flex h-dvh w-[min(19rem,calc(100vw-1.5rem))] flex-col overflow-hidden border-r border-white/12 bg-ink text-white shadow-[18px_0_48px_rgba(17,24,39,0.28)]"
          >
            <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-white/12 px-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center border border-white/30 text-[10px] font-bold tracking-[0.16em]">
                  JM
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold tracking-[-0.025em]">
                    JobMatch
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Career studio
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="focus-ring flex size-11 items-center justify-center text-white/70 hover:text-white"
                aria-label="Đóng menu điều hướng"
              >
                <CloseIcon />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              <button
                type="button"
                onClick={() => navigateFromMobile("copilot")}
                className="focus-ring flex min-h-11 w-full items-center gap-3 border border-cobalt bg-cobalt px-3 text-left text-xs font-bold text-white"
              >
                <PlusIcon />
                <span>Phiên tư vấn mới</span>
              </button>

              <nav className="mt-5" aria-label="Điều hướng di động">
                {NAV_GROUPS.map((group) => (
                  <section key={group.label} className="mb-5 last:mb-0">
                    <h2 className="mb-1 px-3 text-[9px] font-bold uppercase leading-6 tracking-[0.16em] text-white/50">
                      {group.label}
                    </h2>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive = currentScreen === item.id
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              navigateFromMobile(
                                item.id,
                                item.id === "cv-editor" ? null : undefined,
                              )
                            }
                            className={`focus-ring relative flex min-h-11 w-full items-center gap-3 px-3 text-left text-[13px] font-medium transition-colors before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-cobalt before:content-[''] ${
                              isActive
                                ? "bg-white/8 text-white before:block"
                                : "text-white/70 before:hidden hover:bg-white/8 hover:text-white"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            <span className="shrink-0" aria-hidden="true">
                              <Icon />
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            {"badge" in item && item.badge ? (
                              <span className="shrink-0 border border-white/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                                {item.badge}
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </nav>
            </div>

            <div className="shrink-0 border-t border-white/12 p-3 space-y-1">
              <button
                type="button"
                onClick={() => navigateFromMobile("profile")}
                className="focus-ring flex min-h-11 w-full items-center gap-3 px-3 text-left text-[13px] font-medium text-white/70 hover:bg-white/8 hover:text-white rounded-lg"
              >
                <SettingsIcon />
                <span>Cài đặt & Hồ sơ</span>
              </button>
              <button
                type="button"
                onClick={() => navigateFromMobile("auth")}
                className="focus-ring flex min-h-11 w-full items-center gap-3 px-3 text-left text-[13px] font-medium text-red-400 hover:bg-red-500/15 hover:text-red-300 rounded-lg font-semibold"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        d="m4 4 10 10M14 4 4 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path
        d="M8 2.75v10.5M2.75 8h10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path
        d="M1.5 3.5A2 2 0 0 1 3.5 1.5h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.5 2.25V12.5h-1a2 2 0 0 1-2-2v-7Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <circle
        cx="6.75"
        cy="6.75"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="m10.25 10.25 3.25 3.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path
        d="M3.25 2.5A1.25 1.25 0 0 1 4.5 1.25h7A1.25 1.25 0 0 1 12.75 2.5v11l-4.75-2.75-4.75 2.75v-11Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="5" r="2.75" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M2.25 14c0-3.176 2.574-5.75 5.75-5.75S13.75 10.824 13.75 14"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path
        d="m10.75 1.75 3.5 3.5-8.5 8.5H2.25v-3.5l8.5-8.5Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="m9.5 3 3.5 3.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <path
        d="M2 7.75A6 6 0 1 0 8 1.75v6l3.75 2.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M8 1.5v1.75M8 12.75V14.5M1.5 8h1.75M12.75 8h1.75M3.404 3.404l1.237 1.237m6.718 6.718 1.237 1.237m-9.192 0 1.237-1.237m6.718-6.718 1.237-1.237"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}
