import { useEffect, useState } from "react"

import type { Job, Screen } from "../types"

interface JobDetailProps {
  job: Job | null
  onNavigate: (
    screen: Screen,
    job?: Job,
    origin?: "copilot" | "explore" | "matched-jobs" | "saved",
  ) => void
  returnOrigin: "copilot" | "explore" | "matched-jobs" | "saved"
}

const RETURN_LABELS = {
  copilot: "Copilot",
  explore: "Khám phá việc làm",
  "matched-jobs": "Việc làm phù hợp",
  saved: "Theo dõi ứng tuyển",
} as const

const JD_SECTIONS = [
  {
    title: "Trách nhiệm chính",
    content: [
      "Thiết kế và phát triển giao diện người dùng hiệu năng cao bằng React/TypeScript",
      "Tối ưu Core Web Vitals, lazy loading và bundle size",
      "Cộng tác với Product và Design để hiện thực hóa tính năng mới",
      "Mentor junior developers và thực hiện code review chất lượng cao",
      "Tham gia thiết kế kiến trúc front-end và CI/CD pipeline",
    ],
  },
  {
    title: "Yêu cầu bắt buộc",
    content: [
      "Tối thiểu 4 năm kinh nghiệm React và TypeScript trong môi trường production",
      "Thành thạo Next.js 13+ và App Router",
      "Kinh nghiệm với GraphQL và RESTful APIs",
      "Hiểu biết về hệ thống microservices",
      "Tiếng Anh giao tiếp — IELTS 7.0+ hoặc tương đương",
    ],
  },
  {
    title: "Ưu tiên",
    content: [
      "Kinh nghiệm với AWS (EC2, S3, CloudFront)",
      "Biết sử dụng Figma và hiểu Design Systems",
      "Từng làm việc với đội ngũ quốc tế",
    ],
  },
]

const ANALYSIS = {
  matched: [
    {
      skill: "React/TypeScript",
      evidence: "5 năm kinh nghiệm, ghi trong 3 vị trí làm việc",
      confidence: "high",
    },
    {
      skill: "GraphQL",
      evidence: "Đề cập trong dự án VNG Corporation 2022",
      confidence: "high",
    },
    {
      skill: "Node.js & REST API",
      evidence: "Kinh nghiệm tại Axon Active và KMS",
      confidence: "high",
    },
    {
      skill: "AWS cơ bản",
      evidence: "Liệt kê trong phần kỹ năng",
      confidence: "medium",
    },
    {
      skill: "Figma",
      evidence: "Ghi trong kỹ năng thiết kế",
      confidence: "medium",
    },
  ],
  missing: [
    { skill: "Next.js 13+", note: "Không đề cập trong CV", required: true },
    {
      skill: "Tiếng Anh IELTS 7.0+",
      note: "AI suy luận B2 — chưa xác nhận",
      required: true,
    },
    {
      skill: "Kiến trúc microservices",
      note: "Thiếu bằng chứng cụ thể",
      required: false,
    },
  ],
  keywords: [
    "Next.js",
    "App Router",
    "Core Web Vitals",
    "micro-frontend",
    "CI/CD",
    "senior-level",
  ],
  risks: [
    "Yêu cầu IELTS 7.0+ là điều kiện bắt buộc, không phải tiêu chí ưu tiên.",
  ],
  confidence: 88,
  overallVerdict:
    "Hồ sơ phù hợp cao. Cần bổ sung bằng chứng Next.js và xác nhận trình độ tiếng Anh để tăng tỷ lệ vượt vòng sàng lọc.",
}

export default function JobDetail({
  job,
  onNavigate,
  returnOrigin,
}: JobDetailProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    "Đọc cấu trúc và dữ kiện trong CV",
    "Giải mã yêu cầu tuyển dụng trong JD",
    "Đối chiếu kỹ năng và từ khóa",
    "Tính mức độ phù hợp",
    "Xây dựng khuyến nghị ưu tiên",
  ]

  useEffect(() => {
    if (!isAnalyzing) return

    setProgress(0)
    setCurrentStep(0)

    const progressInterval = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => setIsAnalyzing(false), 400)
          return 100
        }
        return previous + 5
      })
    }, 100)

    const stepInterval = setInterval(() => {
      setCurrentStep((previous) => {
        if (previous >= steps.length - 1) {
          clearInterval(stepInterval)
          return previous
        }
        return previous + 1
      })
    }, 450)

    return () => {
      clearInterval(progressInterval)
      clearInterval(stepInterval)
    }
  }, [isAnalyzing])

  const displayJob = job ?? {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    salary: "50–75 triệu/tháng",
    workMode: "Hybrid",
    source: "ITviec",
    postedDays: 2,
    matchScore: 91,
    matchLevel: "strong" as const,
    strengths: [],
    gaps: [],
    tags: ["React", "TypeScript", "GraphQL", "Microservices"],
    description: "",
  }

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-porcelain">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-5 py-9 sm:px-8 lg:py-11">
          <button
            onClick={() => onNavigate(returnOrigin)}
            className="focus-ring mb-7 text-xs font-semibold text-muted-ink hover:text-cobalt"
          >
            ← {RETURN_LABELS[returnOrigin]}
          </button>

          <header className="grid gap-7 border-b border-rule pb-8 lg:grid-cols-[1fr_300px] lg:items-end">
            <div>
              <p className="editorial-kicker">
                {displayJob.source} · Đăng{" "}
                {displayJob.postedDays === 0
                  ? "hôm nay"
                  : String(displayJob.postedDays) + " ngày trước"}
              </p>
              <h1 className="editorial-title mt-3">{displayJob.title}</h1>
              <p className="mt-3 text-base font-semibold text-cobalt">
                {displayJob.company}
              </p>
              <p className="mt-4 text-sm text-muted-ink">
                {displayJob.location} · {displayJob.salary} ·{" "}
                {displayJob.workMode}
              </p>
            </div>

            <div className="border-l-2 border-cobalt pl-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="editorial-kicker">Career signal</p>
                  <p className="mt-2 text-xs text-muted-ink">
                    Mức độ phù hợp tổng thể
                  </p>
                </div>
                <span className="font-editorial text-5xl text-cobalt">
                  {displayJob.matchScore}%
                </span>
              </div>
              <div
                className="career-signal mt-4"
                aria-label={"Mức độ phù hợp " + displayJob.matchScore + "%"}
              >
                <div className="career-signal__bar">
                  <span
                    className="career-signal__fill"
                    style={
                      {
                        "--signal": displayJob.matchScore / 100,
                      } as React.CSSProperties
                    }
                  />
                </div>
              </div>
            </div>
          </header>

          {isAnalyzing ? (
            <section className="mt-8 grid min-h-[440px] place-items-center border-y border-rule bg-paper px-5 py-12">
              <div className="w-full max-w-xl">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="editorial-kicker">Đang phân tích CV & JD</p>
                    <h2 className="mt-3 font-editorial text-3xl text-ink">
                      Đối chiếu bằng chứng nghề nghiệp
                    </h2>
                  </div>
                  <span className="font-editorial text-5xl text-cobalt">
                    {progress}%
                  </span>
                </div>
                <div
                  className="mt-6 h-1 overflow-hidden bg-rule"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <span
                    className="block h-full bg-cobalt transition-[width]"
                    style={{ width: String(progress) + "%" }}
                  />
                </div>
                <div className="mt-8 divide-y divide-rule border-y border-rule">
                  {steps.map((step, index) => {
                    const isDone = index < currentStep
                    const isActive = index === currentStep
                    return (
                      <div
                        key={step}
                        className="flex items-center gap-4 py-3 text-sm"
                        style={{ opacity: isDone || isActive ? 1 : 0.42 }}
                      >
                        <span
                          className={
                            "flex h-7 w-7 items-center justify-center border text-[10px] font-bold " +
                            (isDone
                              ? "border-sage bg-sage text-ink"
                              : isActive
                                ? "animate-pulse border-cobalt text-cobalt"
                                : "border-rule text-muted-ink")
                          }
                          aria-hidden="true"
                        >
                          {isDone ? "✓" : String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={
                            isActive
                              ? "font-semibold text-ink"
                              : "text-muted-ink"
                          }
                        >
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          ) : (
            <div className="mt-8">
              <section className="grid gap-5 border-y border-rule bg-sage/45 px-5 py-6 sm:px-7 lg:grid-cols-[190px_1fr_auto] lg:items-start">
                <div>
                  <p className="editorial-kicker">Nhận định</p>
                  <p className="mt-2 text-xs font-semibold text-[#27633B]">
                    Độ tin cậy {ANALYSIS.confidence}%
                  </p>
                </div>
                <p className="font-editorial text-2xl leading-snug text-ink">
                  {ANALYSIS.overallVerdict}
                </p>
                <button
                  onClick={() => setIsAnalyzing(true)}
                  className="focus-ring min-h-10 self-start border border-rule bg-paper px-4 text-xs font-semibold text-cobalt hover:border-cobalt"
                >
                  Phân tích lại
                </button>
              </section>

              <section className="grid gap-0 border-b border-rule lg:grid-cols-2">
                <div className="py-8 lg:border-r lg:border-rule lg:pr-8">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="editorial-kicker">Bằng chứng</p>
                      <h2 className="mt-2 font-editorial text-3xl text-ink">
                        Năng lực đã khớp
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-[#27633B]">
                      {ANALYSIS.matched.length} điểm mạnh
                    </span>
                  </div>

                  <div className="mt-6 border-t border-rule">
                    {ANALYSIS.matched.map((item, index) => {
                      const isOpen = activeSection === item.skill
                      return (
                        <button
                          key={item.skill}
                          onClick={() =>
                            setActiveSection(isOpen ? null : item.skill)
                          }
                          className="focus-ring block w-full border-b border-rule py-4 text-left"
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-start gap-4">
                            <span className="pt-0.5 font-editorial text-xl text-cobalt">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <strong className="text-sm text-ink">
                                  {item.skill}
                                </strong>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-ink">
                                  {item.confidence === "high"
                                    ? "Tin cậy cao"
                                    : "Tin cậy vừa"}
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-muted-ink">
                                {isOpen
                                  ? item.evidence
                                  : "Mở để xem bằng chứng trong CV"}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-rule py-8 lg:border-t-0 lg:pl-8">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="editorial-kicker">Khoảng trống</p>
                      <h2 className="mt-2 font-editorial text-3xl text-ink">
                        Điều cần xử lý
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-[#9A6700]">
                      {ANALYSIS.missing.length} điểm cần làm rõ
                    </span>
                  </div>

                  <div className="mt-6 border-t border-rule">
                    {ANALYSIS.missing.map((item, index) => (
                      <div
                        key={item.skill}
                        className="border-b border-rule py-4"
                      >
                        <div className="flex items-start gap-4">
                          <span className="pt-0.5 font-editorial text-xl text-[#9A6700]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <strong className="text-sm text-ink">
                                {item.skill}
                              </strong>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A6700]">
                                {item.required ? "Bắt buộc" : "Nên bổ sung"}
                              </span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-ink">
                              {item.note}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-8 border-b border-rule py-8 lg:grid-cols-[1fr_1fr]">
                <div>
                  <p className="editorial-kicker">Từ khóa chưa hiện diện</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {ANALYSIS.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="border border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
                      >
                        + {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border-l-2 border-[#C2413B] pl-4">
                  <p className="editorial-kicker text-[#C2413B]">
                    Rủi ro sàng lọc
                  </p>
                  {ANALYSIS.risks.map((risk) => (
                    <p key={risk} className="mt-3 text-sm leading-6 text-ink">
                      {risk}
                    </p>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {!isRightCollapsed && (
        <aside className="relative w-[360px] flex-none overflow-hidden border-l border-rule bg-paper">
          <div className="flex h-full w-[360px] flex-col">
            <div className="border-b border-rule px-6 py-6">
              <p className="editorial-kicker">Job description</p>
              <h2 className="mt-2 font-editorial text-2xl text-ink">
                Yêu cầu tuyển dụng
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6">
              {JD_SECTIONS.map((section, sectionIndex) => (
                <section
                  key={section.title}
                  className="border-b border-rule py-6"
                >
                  <p className="editorial-kicker">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 text-sm font-bold text-ink">
                    {section.title}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {section.content.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-xs leading-5 text-muted-ink"
                      >
                        <span
                          className="mt-2 h-px w-3 flex-none bg-cobalt"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="border-t border-rule p-5">
              <button
                onClick={() =>
                  onNavigate("cv-editor", displayJob, returnOrigin)
                }
                className="focus-ring min-h-11 w-full bg-cobalt px-4 text-sm font-semibold text-white hover:bg-[#2447bb]"
              >
                Chỉnh CV cho vị trí này
              </button>
              <button className="focus-ring mt-2 min-h-11 w-full border border-rule bg-paper px-4 text-sm font-semibold text-ink hover:border-muted-ink">
                Ứng tuyển tại {displayJob.source} ↗
              </button>
            </div>
          </div>
        </aside>
      )}

      <button
        onClick={() => setIsRightCollapsed((value) => !value)}
        className="focus-ring absolute right-3 top-4 z-20 flex h-10 w-10 items-center justify-center border border-rule bg-paper text-ink shadow-sm"
        aria-label={
          isRightCollapsed ? "Mở mô tả công việc" : "Thu gọn mô tả công việc"
        }
        aria-expanded={!isRightCollapsed}
      >
        {isRightCollapsed ? "JD" : "→"}
      </button>
    </div>
  )
}
