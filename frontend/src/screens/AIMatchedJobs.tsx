import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

import JobCard from "../components/JobCard"
import { JOBS } from "../data"
import type { Job, Screen } from "../types"

interface MatchedJobsProps {
  onNavigate: (screen: Screen, job?: Job, origin?: "matched-jobs") => void
}

const INITIAL_CHIPS = [
  { label: "Frontend", active: true },
  { label: "Senior", active: true },
  { label: "Hybrid / Remote", active: true },
  { label: "TP. Hồ Chí Minh", active: true },
  { label: "40M+/tháng", active: true },
  { label: "ITviec", active: false },
  { label: "LinkedIn", active: false },
]

function SearchIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m11.2 11.2 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function MatchedJobs({ onNavigate }: MatchedJobsProps) {
  const [search, setSearch] = useState("")
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [chips, setChips] = useState(INITIAL_CHIPS)
  const [showAddFilter, setShowAddFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 3

  useEffect(() => {
    setCurrentPage(1)
  }, [search, chips])

  const toggleChip = (label: string) => {
    setChips((current) =>
      current.map((chip) =>
        chip.label === label ? { ...chip, active: !chip.active } : chip,
      ),
    )
  }

  const addNewFilter = (label: string) => {
    setChips((current) =>
      current.some((chip) => chip.label === label)
        ? current.map((chip) =>
            chip.label === label ? { ...chip, active: true } : chip,
          )
        : [...current, { label, active: true }],
    )
    setShowAddFilter(false)
  }

  const matchedList = JOBS.filter(
    (job) => job.matchLevel === "strong" || job.matchLevel === "moderate",
  ).sort((a, b) => b.matchScore - a.matchScore)

  const filteredJobs = matchedList.filter((job) => {
    const query = search.trim().toLowerCase()
    if (
      query &&
      !job.title.toLowerCase().includes(query) &&
      !job.company.toLowerCase().includes(query)
    ) {
      return false
    }

    for (const chip of chips) {
      if (!chip.active) continue

      if (chip.label === "Frontend") {
        const isFrontend =
          job.title.toLowerCase().includes("frontend") ||
          job.title.toLowerCase().includes("react") ||
          job.title.toLowerCase().includes("ui") ||
          job.title.toLowerCase().includes("design")
        if (!isFrontend) return false
      }

      if (chip.label === "Senior") {
        const isSenior =
          job.title.toLowerCase().includes("senior") ||
          job.title.toLowerCase().includes("lead") ||
          job.title.toLowerCase().includes("manager")
        if (!isSenior) return false
      }

      if (chip.label === "Hybrid / Remote") {
        if (job.workMode !== "Hybrid" && job.workMode !== "Remote") return false
      }

      if (chip.label === "TP. Hồ Chí Minh" && job.location !== "TP. Hồ Chí Minh") {
        return false
      }

      if (chip.label === "40M+/tháng" && job.salary.includes("35")) return false
      if (chip.label === "ITviec" && job.source !== "ITviec") return false
      if (chip.label === "LinkedIn" && job.source !== "LinkedIn") return false

      if (
        chip.label === "Backend" &&
        !job.title.toLowerCase().includes("backend") &&
        !job.tags.includes("Node.js")
      ) {
        return false
      }

      if (
        chip.label === "Fullstack" &&
        !job.title.toLowerCase().includes("fullstack")
      ) {
        return false
      }

      if (chip.label === "Hà Nội" && job.location !== "Hà Nội") return false
    }

    return true
  })

  const totalPages = Math.ceil(filteredJobs.length / pageSize)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedJobs = filteredJobs.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  )
  const topScore = filteredJobs[0]?.matchScore ?? 0

  const toggleSave = (job: Job) => {
    setSavedJobs((current) => {
      const next = new Set(current)
      if (next.has(job.id)) next.delete(job.id)
      else next.add(job.id)
      return next
    })
  }

  return (
    <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-porcelain">
      <header className="border-b border-rule bg-paper px-5 py-6 sm:px-8 sm:py-7 lg:px-10">
        <div className="mx-auto max-w-[94rem]">
          <button
            type="button"
            onClick={() => onNavigate("copilot")}
            className="focus-ring mb-7 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-muted-ink transition-colors hover:text-cobalt"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true">
              <path d="m10.5 3-5 5 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Quay lại phiên tư vấn
          </button>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
            <div className="min-w-0">
              <p className="editorial-kicker">AI shortlist</p>
              <h1 className="editorial-title mt-3">Việc làm phù hợp từ AI</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-ink">
                Danh sách rút gọn từ hồ sơ, mục tiêu nghề nghiệp và các tiêu chí bạn đang ưu tiên.
              </p>
            </div>

            <div className="border-l-2 border-cobalt pl-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-ink">Tín hiệu cao nhất</p>
                  <p className="mt-2 text-xs text-muted-ink">trong danh sách hiện tại</p>
                </div>
                <strong className="font-editorial text-4xl font-normal leading-none text-ink">{topScore}<span className="ml-0.5 font-sans text-xs font-semibold text-muted-ink">%</span></strong>
              </div>
              <div className="career-signal mt-3" aria-label={`Mức độ phù hợp cao nhất ${topScore}%`}>
                <div className="career-signal__bar">
                  <span className="career-signal__fill" style={{ "--signal": topScore / 100 } as CSSProperties} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-rule bg-paper px-5 py-5 sm:px-8 lg:px-10" aria-label="Bộ lọc việc làm phù hợp">
        <div className="mx-auto max-w-[94rem]">
          <label className="relative block min-w-0">
            <span className="sr-only">Tìm trong danh sách phù hợp</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink"><SearchIcon /></span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo vị trí hoặc công ty…"
              className="focus-ring min-h-12 w-full border border-rule bg-porcelain py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-muted-ink/75"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => toggleChip(chip.label)}
                className={`focus-ring min-h-11 rounded-full border px-4 text-xs font-semibold transition-colors ${
                  chip.active
                    ? "border-cobalt bg-cobalt text-white"
                    : "border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
                }`}
                aria-pressed={chip.active}
              >
                {chip.label}
              </button>
            ))}

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddFilter((visible) => !visible)}
                className="focus-ring min-h-11 rounded-full border border-dashed border-rule bg-paper px-4 text-xs font-semibold text-muted-ink transition-colors hover:border-cobalt hover:text-cobalt"
                aria-expanded={showAddFilter}
                aria-haspopup="menu"
              >
                + Thêm bộ lọc
              </button>

              {showAddFilter && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setShowAddFilter(false)}
                    aria-label="Đóng danh sách bộ lọc"
                  />
                  <div className="absolute left-0 z-30 mt-2 min-w-44 border border-rule bg-paper p-1 shadow-[0_12px_30px_rgba(17,24,39,0.10)]" role="menu">
                    {["Backend", "Fullstack", "Hà Nội"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => addNewFilter(option)}
                        className="focus-ring block min-h-11 w-full px-3 text-left text-xs font-semibold text-ink transition-colors hover:bg-porcelain hover:text-cobalt"
                        role="menuitem"
                      >
                        + {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10" aria-live="polite">
        <div className="mx-auto max-w-[94rem]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="editorial-kicker">Danh sách rút gọn</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">{filteredJobs.length} cơ hội đáng xem</h2>
            </div>
            <p className="text-xs text-muted-ink">Xếp theo Career Signal</p>
          </div>

          {paginatedJobs.length > 0 ? (
            <>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }}
              >
                {paginatedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onAnalyze={(selectedJob) =>
                      onNavigate("job-detail", selectedJob, "matched-jobs")
                    }
                    onTailor={(selectedJob) =>
                      onNavigate("cv-editor", selectedJob, "matched-jobs")
                    }
                    onSave={toggleSave}
                    saved={savedJobs.has(job.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-ink">
                    Hiển thị <strong className="font-semibold text-ink">{(activePage - 1) * pageSize + 1}–{Math.min(activePage * pageSize, filteredJobs.length)}</strong> trong số <strong className="font-semibold text-ink">{filteredJobs.length}</strong> việc làm
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5" aria-label="Phân trang">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      className="focus-ring min-h-11 border border-rule bg-paper px-3 text-xs font-bold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                    >Trang trước</button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`focus-ring h-11 w-11 text-xs font-bold transition-colors ${
                          activePage === page ? "bg-cobalt text-white" : "border border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
                        }`}
                        aria-label={`Trang ${page}`}
                        aria-current={activePage === page ? "page" : undefined}
                      >{page}</button>
                    ))}
                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                      className="focus-ring min-h-11 border border-rule bg-paper px-3 text-xs font-bold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                    >Trang sau</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-rule bg-paper px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center border border-rule text-muted-ink"><SearchIcon /></span>
              <h2 className="mt-5 font-editorial text-3xl text-ink">Không tìm thấy việc làm phù hợp</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-ink">Tắt bớt bộ lọc hoặc thử một từ khóa rộng hơn.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("")
                  setChips(INITIAL_CHIPS.map((chip) => ({ ...chip, active: false })))
                }}
                className="focus-ring mt-5 min-h-11 bg-cobalt px-5 text-xs font-bold text-white transition-colors hover:bg-ink"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
