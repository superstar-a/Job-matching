import type { Job, Screen } from "../types"

interface JDDetailProps {
  job: Job | null
  onNavigate: (
    screen: Screen,
    job?: Job | null,
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

export default function JDDetail({ job, onNavigate, returnOrigin }: JDDetailProps) {
  if (!job) return null

  const descriptionLines = (job.description ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line && !/^\*+[^*]+\*+:?$/.test(line))
    .slice(0, 5)

  const sections = [
    {
      title: "Vai trò & phạm vi công việc",
      items: descriptionLines.length
        ? descriptionLines
        : [
            `Đảm nhận vai trò ${job.title} và phối hợp cùng các nhóm liên quan.`,
            "Xây dựng, cải tiến sản phẩm và đảm bảo chất lượng bàn giao.",
            "Chủ động đề xuất giải pháp phù hợp với mục tiêu kinh doanh.",
          ],
    },
    {
      title: "Năng lực & yêu cầu",
      items: [
        `Kinh nghiệm và thế mạnh liên quan: ${job.strengths.join(", ")}.`,
        `Năng lực cần bổ sung hoặc ưu tiên: ${job.gaps.join(", ")}.`,
        "Có khả năng giao tiếp, phối hợp và giải quyết vấn đề trong môi trường thực tế.",
      ],
    },
    {
      title: "Quyền lợi & thông tin vị trí",
      items: [
        `Địa điểm làm việc: ${job.location}.`,
        `Mức thu nhập tham khảo: ${job.salary}.`,
        `Hình thức làm việc: ${job.workMode}.`,
        "Cơ hội phát triển chuyên môn thông qua các dự án có tác động rõ ràng.",
      ],
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto bg-porcelain">
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8 lg:py-8">
        <button
          type="button"
          onClick={() => onNavigate(returnOrigin)}
          className="focus-ring text-sm text-muted-ink hover:text-cobalt"
        >
          ← {RETURN_LABELS[returnOrigin]}
        </button>

        <header className="mt-5 border-b border-rule pb-5">
          <p className="editorial-kicker">Job description</p>
          <h1 className="editorial-title mt-2">{job.title}</h1>
          <p className="mt-2 text-sm font-semibold text-cobalt">{job.company}</p>
          <p className="mt-3 text-sm text-muted-ink">
            {job.location} · {job.salary} · {job.workMode}
          </p>
        </header>

        <section className="mt-6">
          <article className="space-y-4">
            {sections.map((section, index) => (
              <section key={section.title} className="border border-rule bg-paper">
                <div className="flex items-center gap-3 border-b border-rule px-5 py-4 sm:px-7">
                  <span className="flex h-7 w-7 items-center justify-center bg-cobalt/10 text-sm font-bold text-cobalt">
                    {index + 1}
                  </span>
                  <h2 className="font-editorial text-2xl text-ink">{section.title}</h2>
                </div>
                <ul className="space-y-3 px-5 py-5 text-sm leading-6 text-muted-ink sm:px-7">
                  {section.items.map((item) => (
                    <li key={item} className="border-l-2 border-cobalt pl-4">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            <button
              type="button"
              onClick={() => onNavigate("job-detail", job, returnOrigin)}
              className="focus-ring mt-7 flex min-h-11 items-center justify-center rounded-[3px] bg-cobalt px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt/90 active:bg-cobalt/80 shadow-xs"
            >
              Phân tích CV–JD
            </button>
          </article>
        </section>
      </div>
    </div>
  )
}
