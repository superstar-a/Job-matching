import type * as React from "react"

import type { Job } from "../types"

interface JobCardProps {
  job: Job
  onAnalyze?: (job: Job) => void
  onSave?: (job: Job) => void
  onTailor?: (job: Job) => void
  compact?: boolean
  saved?: boolean
  showCareerSignal?: boolean
}

const MATCH_LABELS: Record<Job["matchLevel"], string> = {
  strong: "Phù hợp cao",
  moderate: "Phù hợp vừa",
  low: "Cần cân nhắc",
}

function LocationIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M12.5 6.5c0 3.2-4.5 7-4.5 7s-4.5-3.8-4.5-7a4.5 4.5 0 1 1 9 0Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="8" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function SalaryIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M2 6h12M5 10h2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function WorkModeIcon() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 13V5.5h10V13M5.5 5.5V3h5v2.5M1.5 13h13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function JobCard({
  job,
  onAnalyze,
  onSave,
  onTailor,
  compact = false,
  saved = false,
  showCareerSignal = true,
}: JobCardProps) {
  const postedLabel =
    job.postedDays === 0
      ? "Hôm nay"
      : job.postedDays === 1
        ? "Hôm qua"
        : `${job.postedDays} ngày trước`

  return (
    <article
      className={`group flex min-w-0 flex-col border border-rule bg-paper transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-cobalt/45 ${
        compact ? "p-5 sm:p-6" : "p-5"
      }`}
    >
      <div className={compact && showCareerSignal ? "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.46fr)] lg:gap-8" : ""}>
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">
            <span>{job.source}</span>
            <span className="whitespace-nowrap normal-case tracking-normal">{postedLabel}</span>
          </div>

          <h3 className="text-lg font-semibold leading-[1.25] tracking-[-0.02em] text-ink sm:text-xl">
            {job.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-muted-ink">{job.company}</p>

          <dl className="mt-5 grid gap-2 text-xs leading-5 text-muted-ink sm:grid-cols-3">
            <div className="flex min-w-0 items-start gap-2">
              <dt className="mt-0.5 shrink-0 text-cobalt"><LocationIcon /></dt>
              <dd>{job.location}</dd>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <dt className="mt-0.5 shrink-0 text-cobalt"><SalaryIcon /></dt>
              <dd>{job.salary}</dd>
            </div>
            <div className="flex min-w-0 items-start gap-2">
              <dt className="mt-0.5 shrink-0 text-cobalt"><WorkModeIcon /></dt>
              <dd>{job.workMode}</dd>
            </div>
          </dl>
        </div>

        {showCareerSignal && (
          <div className={compact ? "mt-6 border-t border-rule pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0" : "mt-6 border-t border-rule pt-5"}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="editorial-kicker">Career signal</p>
                <p className="mt-1 text-xs font-medium text-muted-ink">{MATCH_LABELS[job.matchLevel]}</p>
              </div>
              <strong className="font-editorial text-[2rem] font-normal leading-none tracking-[-0.03em] text-ink">
                {job.matchScore}<span className="ml-0.5 font-sans text-xs font-semibold text-muted-ink">%</span>
              </strong>
            </div>
            <div className="career-signal mt-3" aria-label={`Mức độ phù hợp ${job.matchScore}%`}>
              <div className="career-signal__bar">
                <span
                  className="career-signal__fill"
                  style={{ "--signal": job.matchScore / 100 } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {!compact && (
        <div className="mt-5 grid grid-cols-2 gap-5 border-t border-rule pt-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink">Bằng chứng phù hợp</p>
            <ul className="mt-2 space-y-1.5">
              {job.strengths.slice(0, 2).map((strength) => (
                <li key={strength} className="flex gap-2 text-xs leading-5 text-muted-ink">
                  <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-cobalt" aria-hidden="true" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink">Điểm cần bù</p>
            <ul className="mt-2 space-y-1.5">
              {job.gaps.slice(0, 2).map((gap) => (
                <li key={gap} className="flex gap-2 text-xs leading-5 text-muted-ink">
                  <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full border border-muted-ink" aria-hidden="true" />
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-1.5" aria-label="Kỹ năng liên quan">
        {job.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-full border border-rule bg-porcelain px-2.5 py-1 text-[11px] font-semibold text-muted-ink">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2.5 border-t border-rule pt-5 sm:flex-nowrap">
        {onAnalyze && (
          <button
            type="button"
            onClick={() => onAnalyze(job)}
            className="focus-ring flex min-h-11 flex-1 items-center justify-center rounded-[3px] bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt/90 active:bg-cobalt/80 whitespace-nowrap shadow-xs"
          >
            Phân tích CV–JD
          </button>
        )}
        {onTailor && (
          <button
            type="button"
            onClick={() => onTailor(job)}
            className="focus-ring flex min-h-11 flex-1 items-center justify-center rounded-[3px] border border-rule bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-muted-ink hover:bg-porcelain active:bg-porcelain/80 whitespace-nowrap"
          >
            Xem JD
          </button>
        )}
        {onSave && (
          <button
            type="button"
            onClick={() => onSave(job)}
            className={`focus-ring flex size-11 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
              saved ? "border-cobalt bg-cobalt text-white" : "border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
            }`}
            aria-label={saved ? `Bỏ lưu ${job.title}` : `Lưu ${job.title}`}
            title={saved ? "Đã lưu" : "Lưu việc làm"}
          >
            <svg width="16" height="16" fill={saved ? "currentColor" : "none"} viewBox="0 0 15 15" aria-hidden="true">
              <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h6A1.5 1.5 0 0 1 12 2.5v11l-4.5-2.5L3 13.5v-11Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
    </article>
  )
}
