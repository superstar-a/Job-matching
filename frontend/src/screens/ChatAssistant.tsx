import { useEffect, useRef, useState } from "react"

import JobCard from "../components/JobCard"
import { CHAT_MESSAGES, CV_DATA, JOBS } from "../data"
import type { Job, Screen } from "../types"

interface AICopilotProps {
  onNavigate: (screen: Screen, job?: Job, origin?: "copilot") => void
  isCvUploaded: boolean
  setCvUploaded: (uploaded: boolean) => void
}

const PREF_CHIPS = [
  { label: "Frontend", type: "role", active: true },
  { label: "Senior", type: "level", active: true },
  { label: "Hybrid / Remote", type: "mode", active: true },
  { label: "TP. Hồ Chí Minh", type: "location", active: true },
  { label: "40M+/tháng", type: "salary", active: true },
  { label: "ITviec", type: "source", active: false },
  { label: "LinkedIn", type: "source", active: false },
]

const EXPAND_PATHS = [
  {
    title: "Frontend Architect",
    match: 78,
    skills: ["System design", "Micro-frontend", "Performance"],
    gap: "Thiếu: Kinh nghiệm kiến trúc hệ thống",
  },
  {
    title: "Engineering Manager",
    match: 62,
    skills: ["Leadership", "Planning", "React expertise"],
    gap: "Thiếu: Trên 2 năm kinh nghiệm quản lý",
  },
  {
    title: "Full-Stack Developer",
    match: 70,
    skills: ["Node.js", "React", "AWS"],
    gap: "Cần nâng: Chuyên môn cơ sở dữ liệu",
  },
]

const CV_IMPROVEMENTS = [
  "Thêm số liệu kết quả (KPI, %, người dùng)",
  "Bổ sung từ khóa Next.js vào kinh nghiệm",
  "Mô tả rõ hơn vai trò trong dự án microservices",
]

interface CareerBriefContentProps {
  activeChips: typeof PREF_CHIPS
  className?: string
  idPrefix: string
  isCvUploaded: boolean
  onNavigate: (screen: Screen, job?: Job, origin?: "copilot") => void
}

function CareerBriefContent({
  activeChips,
  className = "",
  idPrefix,
  isCvUploaded,
  onNavigate,
}: CareerBriefContentProps) {
  const profileReadinessId = `${idPrefix}-profile-readiness-title`
  const activePreferencesId = `${idPrefix}-active-preferences-title`
  const expansionPathsId = `${idPrefix}-expansion-paths-title`
  const cvImprovementsId = `${idPrefix}-cv-improvements-title`

  return (
    <div className={`overflow-y-auto bg-paper px-6 py-6 ${className}`}>
      <div className="pb-5">
        <p className="editorial-kicker">Session notes</p>
        <h2 className="mt-1 font-editorial text-3xl leading-none text-ink">
          Career brief
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted-ink">
          Tóm tắt bằng chứng để bạn cân nhắc trong phiên này.
        </p>
      </div>

      <section
        className="border-t border-rule py-5"
        aria-labelledby={profileReadinessId}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              id={profileReadinessId}
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink"
            >
              Mức sẵn sàng hồ sơ
            </h3>
            <p className="mt-2 text-sm font-semibold text-ink">
              {isCvUploaded ? "CV đã kết nối" : "Chưa có CV trong phiên"}
            </p>
          </div>
          <span
            className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
              isCvUploaded ? "bg-cobalt" : "bg-rule"
            }`}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-ink">Kinh nghiệm</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">
              {CV_DATA.experience} năm
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-ink">Cần cải thiện</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">
              {CV_DATA.improvements} điểm
            </dd>
          </div>
        </dl>
      </section>

      <section
        className="border-t border-rule py-5"
        aria-labelledby={activePreferencesId}
      >
        <div className="flex items-center justify-between gap-4">
          <h3
            id={activePreferencesId}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink"
          >
            Ưu tiên hoạt động
          </h3>
          <span className="text-xs text-muted-ink">{activeChips.length}</span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <li
              key={chip.label}
              className="rounded-full border border-rule bg-porcelain px-2.5 py-1 text-xs text-ink"
            >
              {chip.label}
            </li>
          ))}
        </ul>
      </section>

      <section
        className="border-t border-rule py-5"
        aria-labelledby={expansionPathsId}
      >
        <h3
          id={expansionPathsId}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-ink"
        >
          Hướng mở rộng
        </h3>
        <div className="mt-2">
          {EXPAND_PATHS.map((path) => (
            <article
              key={path.title}
              className="border-b border-rule py-4 last:border-b-0"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="text-sm font-semibold text-ink">{path.title}</h4>
                <span className="text-xs font-semibold text-cobalt">
                  {path.match}%
                </span>
              </div>
              <div
                className="career-signal mt-2"
                aria-label={`Mức phù hợp ${path.match}%`}
              >
                <div className="career-signal__bar">
                  <span
                    className="career-signal__fill"
                    style={
                      {
                        "--signal": path.match / 100,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-ink">
                {path.skills.join(" · ")}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink">{path.gap}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="border-t border-rule pt-5"
        aria-labelledby={cvImprovementsId}
      >
        <h3
          id={cvImprovementsId}
          className="text-xs font-semibold uppercase tracking-[0.12em] text-ink"
        >
          Gợi ý cải thiện CV
        </h3>
        <ol className="mt-3 space-y-3">
          {CV_IMPROVEMENTS.map((tip, index) => (
            <li
              key={tip}
              className="flex gap-3 text-xs leading-5 text-muted-ink"
            >
              <span className="font-semibold text-cobalt">0{index + 1}</span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => onNavigate("cv-editor", undefined, "copilot")}
          className="focus-ring mt-5 inline-flex min-h-11 w-full items-center justify-between border border-cobalt px-3 text-xs font-semibold text-cobalt transition-colors hover:bg-cobalt hover:text-white"
        >
          Xem tất cả gợi ý<span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  )
}

export default function AICopilot({
  onNavigate,
  isCvUploaded,
  setCvUploaded,
}: AICopilotProps) {
  const [messages, setMessages] = useState(CHAT_MESSAGES)
  const [input, setInput] = useState("")
  const [chips, setChips] = useState(PREF_CHIPS)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [isRightCollapsed, setIsRightCollapsed] = useState(
    () => window.matchMedia("(max-width: 1023px)").matches,
  )
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
    })
  }, [messages])

  const sendMessage = () => {
    const text = input.trim()

    if (!text) return

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        role: "user" as const,
        content: text,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ])
    setInput("")

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: "ai" as const,
          content:
            "Tôi đang tìm kiếm thêm cơ hội phù hợp với yêu cầu mới của bạn. Trong lúc đó, hãy xem xét các vị trí đã hiển thị — **VNG Corporation** và **Tiki** vẫn là lựa chọn rất phù hợp với hồ sơ của bạn.",
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ])
    }, 1000)
  }

  const toggleChip = (label: string) => {
    setChips((prev) =>
      prev.map((chip) =>
        chip.label === label ? { ...chip, active: !chip.active } : chip,
      ),
    )
  }

  const toggleSave = (job: Job) => {
    setSavedJobs((prev) => {
      const next = new Set(prev)

      if (next.has(job.id)) next.delete(job.id)
      else next.add(job.id)

      return next
    })
  }

  const activeChips = chips.filter((chip) => chip.active)
  return (
    <div className="flex min-h-0 flex-1 bg-porcelain">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-rule bg-paper px-5 py-3 sm:px-7 lg:px-9">
          <div className="mx-auto max-w-5xl">
            <div
              className="flex min-w-0 items-center gap-3"
              aria-label="Bộ lọc ưu tiên"
            >
              <div className="flex flex-shrink-0 items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink">
                  Ưu tiên đang áp dụng
                </p>
                <span className="hidden text-xs text-muted-ink xl:inline">
                  {activeChips.length} tiêu chí
                </span>
              </div>
              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {chips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    aria-pressed={chip.active}
                    onClick={() => toggleChip(chip.label)}
                    className={`focus-ring min-h-9 flex-none rounded-full border px-3 text-xs font-semibold transition-colors ${
                      chip.active
                        ? "border-cobalt bg-cobalt text-white"
                        : "border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="focus-ring min-h-9 flex-none rounded-full border border-dashed border-rule bg-transparent px-3 text-xs font-semibold text-muted-ink transition-colors hover:border-cobalt hover:text-cobalt"
                >
                  + Thêm bộ lọc
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRightCollapsed((collapsed) => !collapsed)}
              className="focus-ring mt-3 flex min-h-11 w-full items-center justify-between border border-rule bg-paper px-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors hover:border-cobalt hover:text-cobalt lg:hidden"
              aria-label={
                isRightCollapsed ? "Mở Career brief" : "Thu gọn Career brief"
              }
              aria-controls="career-brief-drawer"
              aria-expanded={!isRightCollapsed}
            >
              <span>Career brief</span>
              <span aria-hidden="true">
                {isRightCollapsed ? "Mở →" : "Đang mở"}
              </span>
            </button>
          </div>
        </header>

        <section
          className="flex-1 overflow-y-auto px-5 sm:px-7 lg:px-9"
          aria-label="Cuộc trò chuyện hướng nghiệp"
        >
          <div className="mx-auto max-w-5xl">
            {messages.map((message) => (
              <article
                key={message.id}
                className="border-b border-rule py-6 sm:py-7"
              >
                {message.role === "ai" ? (
                  <div className="max-w-3xl">
                    <div className="mb-3 flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-ink">
                      <span className="text-cobalt">Career copilot</span>
                      <span aria-hidden="true">/</span>
                      <time>{message.timestamp}</time>
                    </div>
                    <div
                      className="border-l-2 border-cobalt pl-5 text-sm leading-7 text-ink [&_strong]:font-semibold [&_strong]:text-cobalt"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                ) : (
                  <div className="ml-auto max-w-2xl border-l-2 border-ink bg-sage/45 px-5 py-4">
                    <div className="mb-2 flex items-center justify-between gap-4 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-ink">
                      <span>Bạn</span>
                      <time>{message.timestamp}</time>
                    </div>
                    <p className="text-sm leading-7 text-ink">
                      {message.content}
                    </p>
                  </div>
                )}

                {"hasJobCards" in message && message.hasJobCards && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <p className="editorial-kicker">Shortlist</p>
                        <h2 className="mt-1 text-base font-semibold text-ink">
                          Cơ hội nên xem trước
                        </h2>
                      </div>
                      <span className="text-xs text-muted-ink">
                        4 / 23 vị trí
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      {JOBS.slice(0, 4).map((job) => (
                        <JobCard
                          key={job.id}
                          job={job}
                          onAnalyze={(selectedJob) =>
                            onNavigate("job-detail", selectedJob, "copilot")
                          }
                          onTailor={(selectedJob) =>
                            onNavigate("jd-detail", selectedJob, "copilot")
                          }
                          onSave={toggleSave}
                          saved={savedJobs.has(job.id)}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate("matched-jobs")}
                      className="focus-ring mt-4 inline-flex min-h-11 items-center gap-2 border-b border-cobalt text-sm font-semibold text-cobalt transition-colors hover:border-ink hover:text-ink"
                    >
                      Xem tất cả việc làm phù hợp
                      <svg
                        aria-hidden="true"
                        width="14"
                        height="14"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </article>
            ))}
            <div ref={bottomRef} />
          </div>
        </section>

        <footer className="border-t border-rule bg-paper px-5 py-2.5 sm:px-7 lg:px-9">
          <div className="relative mx-auto max-w-5xl">
            {isCvUploaded && (
              <div className="absolute bottom-0 left-0 z-10 flex h-7 max-w-[55%] items-center [@media(max-height:700px)]:static [@media(max-height:700px)]:mb-1">
                <div className="inline-flex h-7 max-w-full items-center gap-2 rounded-full border border-rule bg-porcelain px-2 text-xs font-medium text-ink">
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-cobalt"
                  >
                    <path
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="truncate">{CV_DATA.fileName}</span>
                  <button
                    type="button"
                    className="focus-ring -mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-ink transition-colors hover:bg-paper hover:text-ink"
                    onClick={() => setCvUploaded(false)}
                    aria-label={`Gỡ tệp ${CV_DATA.fileName}`}
                  >
                    <svg
                      aria-hidden="true"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M6 18L18 6M6 6l12 12"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <label
              htmlFor="career-message"
              className="sr-only"
            >
              Tin nhắn cho Career copilot
            </label>
            <div className="flex items-center gap-1 border border-rule bg-paper p-1 transition-[border-color,box-shadow] focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/15">
              <button
                type="button"
                onClick={() => setCvUploaded(true)}
                className="focus-ring inline-flex h-11 w-11 flex-shrink-0 items-center justify-center text-muted-ink transition-colors hover:bg-porcelain hover:text-cobalt"
                aria-label="Đính kèm CV"
                title="Đính kèm CV"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M13.5 8L7.5 14a4 4 0 01-5.657-5.657l6.364-6.364a2.5 2.5 0 013.536 3.536L5.379 11.86a1 1 0 01-1.415-1.414l5.657-5.657"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <textarea
                id="career-message"
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    sendMessage()
                  }
                }}
                aria-describedby="career-message-help"
                placeholder="Đổi tiêu chí, hỏi về vị trí hoặc so sánh cơ hội…"
                className="min-h-11 flex-1 resize-none bg-transparent px-2 py-3 text-sm leading-5 text-ink outline-none placeholder:text-muted-ink/70"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!input.trim()}
                className="focus-ring inline-flex h-11 w-11 flex-shrink-0 items-center justify-center bg-cobalt text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:bg-rule disabled:text-muted-ink"
                aria-label="Gửi tin nhắn"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M2 8l12-6-6 12-1.5-5.5L2 8z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <p
              id="career-message-help"
              className="mt-1 flex min-h-7 items-center justify-end truncate text-right text-xs leading-5 text-muted-ink [@media(max-height:700px)]:sr-only"
            >
              Enter để gửi · Shift + Enter để xuống dòng
            </p>
          </div>
        </footer>
      </div>

      {!isRightCollapsed && (
        <>
          <button
            type="button"
            onClick={() => setIsRightCollapsed(true)}
            className="fixed inset-0 z-40 bg-ink/20 lg:hidden"
            aria-label="Đóng lớp phủ Career brief"
          />
          <aside
            id="career-brief-drawer"
            className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,calc(100vw-1rem))] flex-col bg-paper shadow-[-16px_0_40px_rgba(17,24,39,0.16)] lg:hidden"
            aria-label="Career brief"
          >
            <div className="flex min-h-14 flex-shrink-0 items-center justify-between border-b border-rule px-5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-ink">
                Career brief
              </span>
              <button
                type="button"
                onClick={() => setIsRightCollapsed(true)}
                className="focus-ring inline-flex h-11 w-11 items-center justify-center text-muted-ink transition-colors hover:text-cobalt"
                aria-label="Thu gọn Career brief"
                aria-controls="career-brief-drawer"
                aria-expanded="true"
              >
                <svg
                  aria-hidden="true"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <CareerBriefContent
              activeChips={activeChips}
              className="min-h-0 flex-1"
              idPrefix="drawer-career-brief"
              isCvUploaded={isCvUploaded}
              onNavigate={onNavigate}
            />
          </aside>
        </>
      )}

      <aside
        id="desktop-career-brief"
        className={`relative z-20 hidden flex-shrink-0 bg-paper transition-[width] duration-300 lg:block ${
          isRightCollapsed ? "w-0" : "w-[320px]"
        }`}
        aria-label="Career brief"
      >
        {!isRightCollapsed && (
          <CareerBriefContent
            activeChips={activeChips}
            className="h-full w-[320px] border-l border-rule"
            idPrefix="desktop-career-brief"
            isCvUploaded={isCvUploaded}
            onNavigate={onNavigate}
          />
        )}

        <button
          type="button"
          onClick={() => setIsRightCollapsed((collapsed) => !collapsed)}
          className={`focus-ring absolute top-3 z-30 hidden size-11 items-center justify-center border border-rule bg-paper text-muted-ink shadow-sm transition-colors hover:border-cobalt hover:text-cobalt lg:flex ${
            isRightCollapsed ? "-left-[44px]" : "-left-[22px]"
          }`}
          aria-label={
            isRightCollapsed ? "Mở Career brief" : "Thu gọn Career brief"
          }
          aria-expanded={!isRightCollapsed}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-300 ${
              isRightCollapsed ? "rotate-180" : ""
            }`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </aside>
    </div>
  )
}
