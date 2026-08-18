import { useEffect, useState } from "react"

import JobCard from "../components/JobCard"
import SalaryRangeFilter from "../components/SalaryRangeFilter"
import { JOBS } from "../data"
import type { Job, Screen } from "../types"

interface JobExploreProps {
  onNavigate: (screen: Screen, job?: Job, origin?: "explore") => void
}

const TABS = ["Phù hợp nhất", "Mới đăng", "Cơ hội mở rộng"]

const FILTERS = [
  {
    label: "Vị trí",
    options: ["Frontend", "Backend", "Fullstack", "Mobile", "DevOps"],
  },
  {
    label: "Địa điểm",
    options: ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Remote"],
  },
  { label: "Hình thức", options: ["On-site", "Hybrid", "Remote"] },
]

function SearchIcon() {
  return (
    <svg width="17" height="17" fill="none" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m11.2 11.2 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export default function JobExplore({ onNavigate }: JobExploreProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 100])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  useEffect(() => {
    setCurrentPage(1)
  }, [search, activeTab, activeFilters, salaryRange])

  const sortedJobs =
    activeTab === 1
      ? [...JOBS].sort((a, b) => a.postedDays - b.postedDays)
      : activeTab === 2
        ? [...JOBS].sort((a, b) => a.matchScore - b.matchScore)
        : [...JOBS].sort((a, b) => b.matchScore - a.matchScore)

  const filtered = sortedJobs.filter((job) => {
    const query = search.trim().toLowerCase()
    const matchesSearch =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query)

    if (!matchesSearch) return false

    // Salary range filtering (mỗi mức 10 triệu)
    const isSalaryFiltered = salaryRange[0] > 0 || salaryRange[1] < 100
    if (isSalaryFiltered) {
      const nums = job.salary.match(/\d+/g)?.map(Number) || []
      const jobMin = nums[0] ?? 0
      const jobMax = nums[1] ?? jobMin
      if (jobMax < salaryRange[0] || jobMin > salaryRange[1]) {
        return false
      }
    }

    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value) continue

      if (
        key === "Vị trí" &&
        !job.title.toLowerCase().includes(value.toLowerCase()) &&
        !job.tags.includes(value)
      ) {
        return false
      }

      if (key === "Địa điểm" && job.location !== value) return false

      if (key === "Hình thức" && job.workMode !== value) return false
    }

    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedJobs = filtered.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  )

  const isSalaryActive = salaryRange[0] > 0 || salaryRange[1] < 100
  const hasActiveFilters = Object.values(activeFilters).some(Boolean) || isSalaryActive

  const clearFilters = () => {
    setActiveFilters({})
    setSalaryRange([0, 100])
  }

  const resetSearch = () => {
    setSearch("")
    setActiveFilters({})
    setSalaryRange([0, 100])
  }

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
      <header className="border-b border-rule bg-paper px-5 py-4 sm:px-8 sm:py-5 lg:px-10">
        <div className="mx-auto grid max-w-[94rem] gap-7 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="min-w-0">
            <p className="editorial-kicker">Job discovery</p>
            <h1 className="editorial-title mt-2">Khám phá việc làm</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-ink">
              So sánh cơ hội bằng bằng chứng phù hợp, khoảng trống kỹ năng và tín hiệu từ hồ sơ của bạn.
            </p>
          </div>
          <div className="border-l-2 border-cobalt pl-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-ink">Đang hiển thị</p>
            <p className="mt-2 font-editorial text-4xl leading-none text-ink">{filtered.length}</p>
            <p className="mt-2 text-xs leading-5 text-muted-ink">vị trí phù hợp với tiêu chí hiện tại</p>
          </div>
        </div>
      </header>

      <section className="border-b border-rule bg-paper px-5 py-5 sm:px-8 lg:px-10" aria-label="Công cụ tìm kiếm việc làm">
        <div className="mx-auto max-w-[94rem]">
          <div className="w-full">
            <label className="relative block min-w-0">
              <span className="sr-only">Tìm việc làm</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-ink"><SearchIcon /></span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo vị trí hoặc công ty…"
                className="focus-ring min-h-12 w-full border border-rule bg-porcelain py-3 pl-11 pr-4 text-sm text-ink outline-none placeholder:text-muted-ink/75"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {FILTERS.slice(0, 2).map((filter) => (
              <label key={filter.label} className="min-w-0">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={activeFilters[filter.label] || ""}
                  onChange={(event) =>
                    setActiveFilters((current) => ({
                      ...current,
                      [filter.label]: event.target.value,
                    }))
                  }
                  className={`focus-ring min-h-11 max-w-full rounded-full border px-4 text-xs font-semibold outline-none transition-colors ${
                    activeFilters[filter.label]
                      ? "border-cobalt bg-cobalt text-white"
                      : "border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
                  }`}
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}

            {/* Bộ lọc khoảng lương tiền Việt (mỗi mức 10 triệu) */}
            <SalaryRangeFilter
              minSalary={salaryRange[0]}
              maxSalary={salaryRange[1]}
              onChange={setSalaryRange}
            />

            {FILTERS.slice(2).map((filter) => (
              <label key={filter.label} className="min-w-0">
                <span className="sr-only">{filter.label}</span>
                <select
                  value={activeFilters[filter.label] || ""}
                  onChange={(event) =>
                    setActiveFilters((current) => ({
                      ...current,
                      [filter.label]: event.target.value,
                    }))
                  }
                  className={`focus-ring min-h-11 max-w-full rounded-full border px-4 text-xs font-semibold outline-none transition-colors ${
                    activeFilters[filter.label]
                      ? "border-cobalt bg-cobalt text-white"
                      : "border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
                  }`}
                >
                  <option value="">{filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="focus-ring min-h-11 px-3 text-xs font-bold text-cobalt underline decoration-rule underline-offset-4 hover:decoration-cobalt"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </section>

      <nav className="border-b border-rule bg-paper px-5 sm:px-8 lg:px-10" aria-label="Sắp xếp cơ hội">
        <div className="mx-auto flex max-w-[94rem] flex-wrap gap-x-7">
          {TABS.map((tab, index) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`focus-ring min-h-12 border-b-2 py-3 text-sm font-semibold transition-colors ${
                activeTab === index ? "border-cobalt text-cobalt" : "border-transparent text-muted-ink hover:text-ink"
              }`}
              aria-current={activeTab === index ? "page" : undefined}
            >
              {tab}
              {index === 0 && (
                <span className="ml-2 font-mono text-[10px] text-muted-ink">{JOBS.filter((job) => job.matchLevel === "strong").length}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <section className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10" aria-live="polite">
        <div className="mx-auto max-w-[94rem]">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="editorial-kicker">Kết quả</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-ink">{TABS[activeTab]}</h2>
            </div>
            <p className="text-xs text-muted-ink">Trang {activePage} / {Math.max(totalPages, 1)}</p>
          </div>

          {paginatedJobs.length > 0 ? (
            <>
              <div
                className={viewMode === "grid" ? "grid gap-4" : "grid gap-3"}
                style={
                  viewMode === "grid"
                    ? { gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))" }
                    : undefined
                }
              >
                {paginatedJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    compact={viewMode === "list"}
                    showCareerSignal={false}
                    onAnalyze={(selectedJob) =>
                      onNavigate("job-detail", selectedJob, "explore")
                    }
                    onTailor={(selectedJob) =>
                      onNavigate("jd-detail", selectedJob, "explore")
                    }
                    onSave={toggleSave}
                    saved={savedJobs.has(job.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-ink">
                    Hiển thị <strong className="font-semibold text-ink">{(activePage - 1) * pageSize + 1}–{Math.min(activePage * pageSize, filtered.length)}</strong> trong số <strong className="font-semibold text-ink">{filtered.length}</strong> việc làm
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5" aria-label="Phân trang">
                    <button
                      type="button"
                      disabled={activePage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                      className="focus-ring min-h-11 border border-rule bg-paper px-3 text-xs font-bold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Trang trước
                    </button>
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
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                      className="focus-ring min-h-11 border border-rule bg-paper px-3 text-xs font-bold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-rule bg-paper px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center border border-rule text-muted-ink"><SearchIcon /></span>
              <h2 className="mt-5 font-editorial text-3xl text-ink">Không tìm thấy việc làm phù hợp</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-ink">Thử từ khóa khác hoặc nới rộng một vài tiêu chí tìm kiếm.</p>
              <button type="button" onClick={resetSearch} className="focus-ring mt-5 min-h-11 bg-cobalt px-5 text-xs font-bold text-white transition-colors hover:bg-ink">Đặt lại tìm kiếm</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
