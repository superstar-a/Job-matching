import { useEffect, useRef, useState } from "react"

import type { Job, Screen, CVVersion } from "../types"

import { CV_CONTENT } from "../data"

interface CVEditorProps {
  job: Job | null

  onNavigate: (screen: Screen, job?: Job | null) => void

  cvVersions: CVVersion[]

  setCvVersions: React.Dispatch<React.SetStateAction<CVVersion[]>>
}

type SuggestionType = "safe" | "needs-input" | "insufficient"

interface Suggestion {
  id: string

  section: string

  type: SuggestionType

  before: string

  after: string

  rationale: string

  status: "pending" | "applied" | "rejected"
}

const INITIAL_SUGGESTIONS: Suggestion[] = [
  {
    id: "s1",

    section: "Kinh nghiệm · VNG Corporation",

    type: "safe",

    before: "Phát triển giao diện người dùng bằng React và TypeScript.",

    after:
      "Phát triển và tối ưu giao diện người dùng bằng React/TypeScript, cải thiện Core Web Vitals 40% (LCP từ 3.2s → 1.9s) phục vụ 15 triệu người dùng hàng tháng.",

    rationale:
      "Bổ sung số liệu cụ thể từ kinh nghiệm trong CV. Số liệu này có thể xác minh được từ phần mô tả dự án bạn cung cấp.",

    status: "pending",
  },

  {
    id: "s2",

    section: "Kỹ năng",

    type: "safe",

    before: "React, TypeScript, Node.js, GraphQL, AWS, Figma",

    after:
      "React, TypeScript, Next.js, Node.js, GraphQL, AWS (S3, CloudFront, EC2), Figma, Redux Toolkit, React Query",

    rationale:
      "Thêm Next.js và công cụ cụ thể hơn để khớp từ khóa trong JD của VNG Corporation.",

    status: "pending",
  },

  {
    id: "s3",

    section: "Kinh nghiệm · Axon Active",

    type: "needs-input",

    before: "Làm việc trong môi trường Agile với khách hàng quốc tế.",

    after:
      "Dẫn dắt sprint planning và demo cho khách hàng Mỹ và Châu Âu trong môi trường Agile, [số lượng] dự án hoàn thành đúng hạn.",

    rationale:
      "Cần bạn bổ sung số liệu cụ thể — số dự án hoặc tỷ lệ thành công. AI không tự điền thông tin không có trong CV.",

    status: "pending",
  },

  {
    id: "s4",

    section: "Tóm tắt",

    type: "insufficient",

    before: "",

    after:
      "Senior Frontend Developer với [X] năm kinh nghiệm tại các công ty sản phẩm hàng đầu Việt Nam...",

    rationale:
      "CV chưa có phần tóm tắt. Đây là gợi ý sườn — AI không đủ thông tin để viết đầy đủ mà không có rủi ro không chính xác.",

    status: "pending",
  },
]

const MOCK_SUGGESTIONS_BY_JOB: Record<string, Suggestion[]> = {
  "1": [
    {
      id: "s1",

      section: "Kinh nghiệm · VNG Corporation",

      type: "safe",

      before: "Phát triển giao diện người dùng bằng React và TypeScript.",

      after:
        "Phát triển và tối ưu giao diện người dùng bằng React/TypeScript, cải thiện Core Web Vitals 40% (LCP từ 3.2s → 1.9s) phục vụ 15 triệu người dùng hàng tháng.",

      rationale:
        "Bổ sung số liệu cụ thể từ kinh nghiệm trong CV. Số liệu này có thể xác minh được từ phần mô tả dự án bạn cung cấp.",

      status: "applied",
    },

    {
      id: "s2",

      section: "Kỹ năng",

      type: "safe",

      before: "React, TypeScript, Node.js, GraphQL, AWS, Figma",

      after:
        "React, TypeScript, Next.js, Node.js, GraphQL, AWS (S3, CloudFront, EC2), Figma, Redux Toolkit, React Query",

      rationale:
        "Thêm Next.js và công cụ cụ thể hơn để khớp từ khóa trong JD của VNG Corporation.",

      status: "applied",
    },

    {
      id: "s3",

      section: "Kinh nghiệm · Axon Active",

      type: "needs-input",

      before: "Làm việc trong môi trường Agile với khách hàng quốc tế.",

      after:
        "Dẫn dắt sprint planning và demo cho khách hàng Mỹ và Châu Âu trong môi trường Agile, [số lượng] dự án hoàn thành đúng hạn.",

      rationale:
        "Cần bạn bổ sung số liệu cụ thể — số dự án hoặc tỷ lệ thành công. AI không tự điền thông tin không có trong CV.",

      status: "pending",
    },

    {
      id: "s4",

      section: "Tóm tắt",

      type: "insufficient",

      before: "",

      after:
        "Senior Frontend Developer với [X] năm kinh nghiệm tại các công ty sản phẩm hàng đầu Việt Nam...",

      rationale:
        "CV chưa có phần tóm tắt. Đây là gợi ý sườn — AI không đủ thông tin để viết đầy đủ mà không có rủi ro không chính xác.",

      status: "pending",
    },
  ],

  "2": [
    {
      id: "t1",

      section: "Kinh nghiệm · Axon Active",

      type: "safe",

      before:
        "Phát triển features cho khách hàng tại Thụy Sĩ và Đức sử dụng React/Redux.",

      after:
        "Phát triển các tính năng giỏ hàng và thanh toán cho đối tác Thụy Sĩ/Đức sử dụng React/Redux, nâng cao 15% tốc độ tải trang.",

      rationale:
        "Chi tiết hóa công việc để phù hợp với vị trí phát triển sản phẩm giỏ hàng tại Tiki.",

      status: "applied",
    },

    {
      id: "t2",

      section: "Kỹ năng",

      type: "safe",

      before: "React, TypeScript, Node.js, GraphQL, AWS, Figma",

      after: "React, TypeScript, Vue.js, Node.js, GraphQL, AWS, Figma, Webpack",

      rationale:
        "Bổ sung Vue.js như một kỹ năng phụ trợ phù hợp với yêu cầu đa nền tảng của Tiki.",

      status: "applied",
    },
  ],

  "3": [
    {
      id: "m1",

      section: "Kinh nghiệm · VNG Corporation",

      type: "safe",

      before:
        "Tích hợp GraphQL API với Apollo Client cho ứng dụng thương mại điện tử.",

      after:
        "Tích hợp GraphQL API với Apollo Client cho ứng dụng ví điện tử/thương mại điện tử, xử lý dữ liệu giao dịch bảo mật cao.",

      rationale:
        "Nhấn mạnh tính chất bảo mật giao dịch, phù hợp với lĩnh vực Fintech của MoMo.",

      status: "applied",
    },

    {
      id: "m2",

      section: "Kỹ năng",

      type: "needs-input",

      before: "React, TypeScript, Node.js, GraphQL, AWS, Figma",

      after: "React, TypeScript, React Native, Node.js, GraphQL, AWS, Figma",

      rationale:
        "MoMo yêu cầu kỹ năng di động. Bạn đã từng làm React Native hoặc Mobile Web chưa? Hãy bổ sung.",

      status: "pending",
    },

    {
      id: "m3",

      section: "Kinh nghiệm · Nashtech Global",

      type: "safe",

      before:
        "Phát triển web application cho khách hàng Australia sử dụng Angular và .NET.",

      after:
        "Phát triển web application tài chính cho khách hàng Australia sử dụng Angular và .NET.",

      rationale: "Thêm định hướng tài chính (finance) để khớp hồ sơ Fintech.",

      status: "pending",
    },
  ],
}

const TYPE_CONFIG: Record<SuggestionType, {
  label: string
  bg: string
  text: string
  border: string
}> = {
  safe: {
    label: "An toàn để áp dụng",
    bg: "#F0FDF9",
    text: "#059669",
    border: "#A7F3D0",
  },

  "needs-input": {
    label: "Cần thông tin từ bạn",
    bg: "#FEF3C7",
    text: "#92400E",
    border: "#FDE68A",
  },

  insufficient: {
    label: "Không đủ bằng chứng",
    bg: "#FEF2F2",
    text: "#DC2626",
    border: "#FECACA",
  },
}

type ChangeKind = "unchanged" | "added" | "edited" | "removed"

interface ComparisonRow {
  id: string
  original: string | null
  edited: string | null
  originalIndex: number | null
  editedIndex: number | null
  kind: ChangeKind
}

interface DiffOperation {
  type: "unchanged" | "added" | "removed"
  text: string
  originalIndex: number | null
  editedIndex: number | null
}

const CHANGE_LABELS: Record<Exclude<ChangeKind, "unchanged">, string> = {
  added: "Đã thêm",
  edited: "Đã chỉnh sửa",
  removed: "Đã xóa",
}

function buildComparisonRows(original: string, edited: string): ComparisonRow[] {
  const originalLines = original.split("\n")
  const editedLines = edited.split("\n")
  const matrix = Array.from({ length: originalLines.length + 1 }, () =>
    Array<number>(editedLines.length + 1).fill(0),
  )

  for (let originalIndex = originalLines.length - 1; originalIndex >= 0; originalIndex -= 1) {
    for (let editedIndex = editedLines.length - 1; editedIndex >= 0; editedIndex -= 1) {
      matrix[originalIndex][editedIndex] =
        originalLines[originalIndex] === editedLines[editedIndex]
          ? matrix[originalIndex + 1][editedIndex + 1] + 1
          : Math.max(
              matrix[originalIndex + 1][editedIndex],
              matrix[originalIndex][editedIndex + 1],
            )
    }
  }

  const operations: DiffOperation[] = []
  let originalIndex = 0
  let editedIndex = 0

  while (originalIndex < originalLines.length || editedIndex < editedLines.length) {
    if (
      originalIndex < originalLines.length &&
      editedIndex < editedLines.length &&
      originalLines[originalIndex] === editedLines[editedIndex]
    ) {
      operations.push({
        type: "unchanged",
        text: originalLines[originalIndex],
        originalIndex,
        editedIndex,
      })
      originalIndex += 1
      editedIndex += 1
    } else if (
      editedIndex < editedLines.length &&
      (originalIndex === originalLines.length ||
        matrix[originalIndex][editedIndex + 1] >=
          matrix[originalIndex + 1][editedIndex])
    ) {
      operations.push({
        type: "added",
        text: editedLines[editedIndex],
        originalIndex: null,
        editedIndex,
      })
      editedIndex += 1
    } else {
      operations.push({
        type: "removed",
        text: originalLines[originalIndex],
        originalIndex,
        editedIndex: null,
      })
      originalIndex += 1
    }
  }

  const rows: ComparisonRow[] = []
  let operationIndex = 0

  while (operationIndex < operations.length) {
    const operation = operations[operationIndex]

    if (operation.type === "unchanged") {
      rows.push({
        id: `row-${operation.originalIndex}-${operation.editedIndex}`,
        original: operation.text,
        edited: operation.text,
        originalIndex: operation.originalIndex,
        editedIndex: operation.editedIndex,
        kind: "unchanged",
      })
      operationIndex += 1
      continue
    }

    const changeBlock: DiffOperation[] = []
    while (
      operationIndex < operations.length &&
      operations[operationIndex].type !== "unchanged"
    ) {
      changeBlock.push(operations[operationIndex])
      operationIndex += 1
    }

    const removals = changeBlock.filter((item) => item.type === "removed")
    const additions = changeBlock.filter((item) => item.type === "added")
    const pairedCount = Math.min(removals.length, additions.length)

    for (let index = 0; index < pairedCount; index += 1) {
      rows.push({
        id: `row-${removals[index].originalIndex}-${additions[index].editedIndex}`,
        original: removals[index].text,
        edited: additions[index].text,
        originalIndex: removals[index].originalIndex,
        editedIndex: additions[index].editedIndex,
        kind: "edited",
      })
    }

    removals.slice(pairedCount).forEach((item) => {
      rows.push({
        id: `row-${item.originalIndex}-removed`,
        original: item.text,
        edited: null,
        originalIndex: item.originalIndex,
        editedIndex: null,
        kind: "removed",
      })
    })

    additions.slice(pairedCount).forEach((item) => {
      rows.push({
        id: `row-added-${item.editedIndex}`,
        original: null,
        edited: item.text,
        originalIndex: null,
        editedIndex: item.editedIndex,
        kind: "added",
      })
    })
  }

  return rows
}

interface SkillRecommendation {
  skill: string

  priority: "high" | "medium" | "low"

  reason: string

  timeEstimate: string

  resources: string[]

  action: string
}

const SKILL_RECOMMENDATIONS: Record<string, SkillRecommendation[]> = {
  "1": [
    {
      skill: "Next.js 14 & App Router",

      priority: "high",

      reason:
        "JD yêu cầu kinh nghiệm Next.js 13+ với App Router. CV hiện tại không đề cập đến Next.js — đây là khoảng trống lớn nhất.",

      timeEstimate: "4–6 tuần",

      resources: [
        "Next.js Official Tutorial",
        "Vercel App Router Documentation",
        "Lee Robinson YouTube Channel",
      ],

      action: "Thêm dự án Next.js vào portfolio ngay",
    },

    {
      skill: "Micro-Frontend Architecture",

      priority: "high",

      reason:
        "Vị trí Senior tại VNG yêu cầu khả năng thiết kế kiến trúc. Micro-frontend là xu hướng phổ biến tại các công ty sản phẩm lớn.",

      timeEstimate: "6–8 tuần",

      resources: [
        "Module Federation Docs",
        "Single-SPA Documentation",
        "Micro Frontends in Action (Manning)",
      ],

      action: "Thực hành với Webpack Module Federation",
    },

    {
      skill: "Performance Optimization (Core Web Vitals)",

      priority: "medium",

      reason:
        'JD nhấn mạnh "Core Web Vitals" và tối ưu hiệu suất. Bổ sung kiến thức này sẽ tăng cơ hội phỏng vấn đáng kể.',

      timeEstimate: "2–3 tuần",

      resources: [
        "web.dev/performance",
        "Chrome DevTools Performance Panel",
        "Lighthouse CI Documentation",
      ],

      action: "Đo và cải thiện LCP, CLS, FID trên dự án thực",
    },

    {
      skill: "CI/CD & DevOps cơ bản",

      priority: "medium",

      reason:
        'JD yêu cầu kinh nghiệm CI/CD. CV chỉ ghi "làm việc với DevOps" mà chưa nêu công cụ cụ thể.',

      timeEstimate: "2–4 tuần",

      resources: [
        "GitHub Actions Documentation",
        "Docker for Frontend Developers",
        "Vercel Deployment Guides",
      ],

      action: "Setup CI/CD pipeline cho dự án cá nhân",
    },

    {
      skill: "Tiếng Anh giao tiếp (IELTS 7.0+)",

      priority: "high",

      reason:
        "JD yêu cầu IELTS 7.0+. AI suy luận trình độ B2 từ CV — cần nâng cấp lên C1 để đáp ứng yêu cầu bắt buộc.",

      timeEstimate: "3–6 tháng",

      resources: [
        "IELTS Speaking Practice (British Council)",
        "Cambly / iTalki 1-on-1",
        "TED Talks Daily Practice",
      ],

      action: "Đăng ký thi IELTS và luyện speaking mỗi ngày",
    },

    {
      skill: "System Design cho Frontend",

      priority: "low",

      reason:
        "Kỹ năng thiết kế hệ thống giúp nổi bật trong vòng phỏng vấn Senior/Lead. Chưa phải yêu cầu bắt buộc nhưng là lợi thế lớn.",

      timeEstimate: "Dài hạn",

      resources: [
        "Frontend System Design Guide (Alex Xu)",
        "GreatFrontEnd System Design",
        "Designing Data-Intensive Apps",
      ],

      action: "Luyện 1 bài system design mỗi tuần",
    },
  ],

  "2": [
    {
      skill: "Vue.js / Nuxt.js",

      priority: "high",

      reason:
        "Tiki sử dụng Vue.js trong một số sản phẩm. CV chỉ ghi React — thêm Vue sẽ mở rộng cơ hội.",

      timeEstimate: "3–4 tuần",

      resources: [
        "Vue 3 Composition API Docs",
        "Nuxt.js Official Guide",
        "Vue Mastery Courses",
      ],

      action: "Build 1 mini-project với Vue 3",
    },

    {
      skill: "E-commerce Frontend Patterns",

      priority: "medium",

      reason:
        "Tiki là nền tảng TMĐT lớn. Hiểu các pattern như lazy loading, cart management, checkout flow sẽ là lợi thế.",

      timeEstimate: "2–3 tuần",

      resources: [
        "Shopify Polaris Design System",
        "E-commerce UX Best Practices",
        "A/B Testing Fundamentals",
      ],

      action: "Phân tích flow checkout của Tiki và Shopee",
    },

    {
      skill: "Webpack & Build Optimization",

      priority: "medium",

      reason:
        "JD đề cập Webpack. CV chưa ghi rõ kinh nghiệm build tools ngoài React defaults.",

      timeEstimate: "2 tuần",

      resources: [
        "Webpack 5 Documentation",
        "Bundle Analysis with Webpack",
        "Vite Migration Guide",
      ],

      action: "Tối ưu bundle size trên dự án hiện tại",
    },
  ],

  "3": [
    {
      skill: "React Native / Mobile Development",

      priority: "high",

      reason:
        "MoMo là ứng dụng mobile-first. JD yêu cầu kinh nghiệm React Native hoặc Mobile Web. CV chưa đề cập.",

      timeEstimate: "6–8 tuần",

      resources: [
        "React Native Official Docs",
        "Expo Documentation",
        "React Native Navigation Guide",
      ],

      action: "Build 1 app mobile với React Native + Expo",
    },

    {
      skill: "Fintech Security & Compliance",

      priority: "high",

      reason:
        "MoMo xử lý giao dịch tài chính. Hiểu biết về bảo mật (OWASP, PCI-DSS) là yêu cầu quan trọng.",

      timeEstimate: "3–4 tuần",

      resources: [
        "OWASP Top 10 for Frontend",
        "PCI-DSS Compliance Basics",
        "Secure Coding Practices (Mozilla)",
      ],

      action: "Tìm hiểu OWASP Top 10 và áp dụng vào code",
    },

    {
      skill: "Payment Gateway Integration",

      priority: "medium",

      reason:
        "Kinh nghiệm tích hợp cổng thanh toán (Stripe, PayPal, VNPay) sẽ phù hợp với lĩnh vực Fintech.",

      timeEstimate: "2–3 tuần",

      resources: [
        "Stripe API Documentation",
        "VNPay Integration Guide",
        "Payment Security Best Practices",
      ],

      action: "Tích hợp Stripe/VNPay vào demo project",
    },
  ],
}

export default function CVEditor({
  job,
  onNavigate,
  cvVersions,
  setCvVersions,
}: CVEditorProps) {
  const [libraryPage, setLibraryPage] = useState(1)

  // Automatically add a new version if we entered editor with a job not already in the list

  useEffect(() => {
    if (job && !cvVersions.some((v) => v.job.id === job.id)) {
      const newVersion: CVVersion = {
        id: `cv-${Date.now()}`,

        job: job,

        lastUpdated: "Vừa xong",

        status: "editing",

        appliedCount: (
          MOCK_SUGGESTIONS_BY_JOB[job.id] ?? INITIAL_SUGGESTIONS
        ).filter((s) => s.status === "applied").length,

        totalSuggestions: (
          MOCK_SUGGESTIONS_BY_JOB[job.id] ?? INITIAL_SUGGESTIONS
        ).length,

        cvContent: CV_CONTENT,
      }

      setCvVersions((prev) => [newVersion, ...prev])
    }
  }, [job, cvVersions, setCvVersions])

  // Resolve active CV version state

  const activeVersion = job ? cvVersions.find((v) => v.job.id === job.id) : null

  const baseContent = activeVersion ? activeVersion.cvContent : CV_CONTENT
  // Demo data keeps the two panes visibly different until a real AI edit is applied.
  const demoEditedContent =
    baseContent === CV_CONTENT
      ? `${baseContent.replace("Senior Frontend Developer", "Senior Frontend Engineer")}\n\nADDED SKILLS\nNext.js · Jest · Playwright`
      : baseContent
  const initialContent = demoEditedContent

  const initialSuggestions = job
    ? (MOCK_SUGGESTIONS_BY_JOB[job.id] ?? INITIAL_SUGGESTIONS)
    : INITIAL_SUGGESTIONS

  const [suggestions, setSuggestions] = useState(initialSuggestions)

  const [cvContent, setCvContent] = useState(initialContent)

  // Kept for the legacy hidden markup below; the visible editor uses the
  // side-by-side comparison surface instead of tabs.
  const [activeTab, setActiveTab] = useState<"content" | "suggestions">(
    "content",
  )

  const [diffView, setDiffView] = useState<string | null>(null)

  const [saved, setSaved] = useState(false)

  const [originalCV, setOriginalCV] = useState(() =>
    activeVersion ? CV_CONTENT : "",
  )

  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)

  const editedPaneRef = useRef<HTMLDivElement>(null)

  const originalPaneRef = useRef<HTMLDivElement>(null)

  const isSynchronizingScroll = useRef(false)

  // Sync state if initial changes

  useEffect(() => {
    setCvContent(initialContent)

    setSuggestions(initialSuggestions)

    setOriginalCV(activeVersion ? CV_CONTENT : "")

    setSelectedRowId(null)
  }, [job?.id])

  const displayJob = job ?? {
    title: "Senior Frontend Engineer",
    company: "VNG Corporation",
  }

  const apply = (id: string) => {
    const s = suggestions.find((item) => item.id === id)

    if (!s) return

    let newContent = cvContent

    if (s.before) {
      newContent = cvContent.replace(s.before, s.after)

      setCvContent(newContent)
    }

    const updatedSuggestions = suggestions.map((item) =>
      item.id === id ? { ...item, status: "applied" as const } : item,
    )

    setSuggestions(updatedSuggestions)

    if (job) {
      setCvVersions((prev) =>
        prev.map((v) =>
          v.job.id === job.id
            ? {
                ...v,

                cvContent: newContent,

                appliedCount: updatedSuggestions.filter(
                  (item) => item.status === "applied",
                ).length,

                totalSuggestions: updatedSuggestions.length,
              }
            : v,
        ),
      )
    }
  }

  const reject = (id: string) => {
    const updatedSuggestions = suggestions.map((s) =>
      s.id === id ? { ...s, status: "rejected" as const } : s,
    )

    setSuggestions(updatedSuggestions)

    if (job) {
      setCvVersions((prev) =>
        prev.map((v) =>
          v.job.id === job.id
            ? {
                ...v,

                appliedCount: updatedSuggestions.filter(
                  (item) => item.status === "applied",
                ).length,

                totalSuggestions: updatedSuggestions.length,
              }
            : v,
        ),
      )
    }
  }

  const pending = suggestions.filter((s) => s.status === "pending")

  const applied = suggestions.filter((s) => s.status === "applied")

  const comparisonRows = buildComparisonRows(originalCV, cvContent)

  const selectComparisonRow = (row: ComparisonRow) => {
    setSelectedRowId(row.id)
    const targetIndex = row.editedIndex ?? row.originalIndex
    if (targetIndex === null) return
    const scrollRatio = Math.max(0, targetIndex / Math.max(comparisonRows.length - 1, 1))
    const editedPane = editedPaneRef.current
    const originalPane = originalPaneRef.current
    if (editedPane) editedPane.scrollTop = scrollRatio * (editedPane.scrollHeight - editedPane.clientHeight)
    if (originalPane) originalPane.scrollTop = scrollRatio * (originalPane.scrollHeight - originalPane.clientHeight)
  }

  // RENDER 1: CV version library

  if (!job) {
    const totalCVs = cvVersions.length
    const avgMatch = Math.round(
      cvVersions.reduce((sum, version) => sum + version.job.matchScore, 0) /
        (totalCVs || 1),
    )
    const appliedTotal = cvVersions.reduce(
      (sum, version) => sum + version.appliedCount,
      0,
    )
    const suggestionTotal = cvVersions.reduce(
      (sum, version) => sum + version.totalSuggestions,
      0,
    )

    return (
      <div className="flex-1 overflow-y-auto bg-porcelain">
        <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:py-8">
          <header className="border-b border-rule pb-4">
            <p className="editorial-kicker">CV library</p>
            <h1 className="editorial-title mt-2">CV theo từng cơ hội</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-ink">
              Mỗi phiên bản giữ một luận điểm nghề nghiệp riêng, được điều
              chỉnh theo bằng chứng và yêu cầu của từng vị trí.
            </p>
          </header>

          <section className="grid grid-cols-3 border-b border-rule py-6">
            {[
              ["Phiên bản CV", totalCVs, ""],
              ["Phù hợp trung bình", avgMatch, "%"],
              ["Gợi ý đã áp dụng", appliedTotal, "/" + suggestionTotal],
            ].map(([label, value, suffix], index) => (
              <div
                key={label}
                className={index === 0 ? "" : "border-l border-rule pl-5"}
              >
                <p className="font-editorial text-4xl text-ink">
                  {value}
                  <span className="font-sans text-xs text-muted-ink">
                    {suffix}
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-ink">{label}</p>
              </div>
            ))}
          </section>

          {(() => {
            const pageSize = 3
            const totalPages = Math.ceil(cvVersions.length / pageSize)
            const activePage = Math.min(libraryPage, totalPages || 1)
            const paginatedVersions = cvVersions.slice(
              (activePage - 1) * pageSize,
              activePage * pageSize,
            )

            return (
              <>
                <section className="mt-7 divide-y divide-rule border-y border-rule bg-paper">
                  {paginatedVersions.map((version) => {
                    const ratio =
                      version.appliedCount / (version.totalSuggestions || 1)

                    return (
                      <article
                        key={version.id}
                        className="grid gap-5 px-5 py-6 hover:bg-porcelain/60 md:grid-cols-[minmax(220px,1fr)_220px_150px_auto] md:items-center"
                      >
                        <div>
                          <p className="text-sm font-bold text-ink">
                            {version.job.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-ink">
                            {version.job.company}
                          </p>
                          <p className="mt-3 text-[11px] text-muted-ink">
                            Cập nhật {version.lastUpdated}
                          </p>
                        </div>
                        <div>
                          <div
                            className="career-signal"
                            aria-label={
                              "Mức độ phù hợp " + version.job.matchScore + "%"
                            }
                          >
                            <div className="career-signal__bar">
                              <span
                                className="career-signal__fill"
                                style={
                                  {
                                    "--signal": version.job.matchScore / 100,
                                  } as React.CSSProperties
                                }
                              />
                            </div>
                            <strong className="text-ink">
                              {version.job.matchScore}%
                            </strong>
                          </div>
                          <p className="mt-2 text-[11px] text-muted-ink">
                            Career signal
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">
                            {version.status === "completed"
                              ? "● Đã hoàn tất"
                              : "◐ Đang chỉnh sửa"}
                          </p>
                          <p className="mt-2 text-[11px] text-muted-ink">
                            {version.appliedCount}/{version.totalSuggestions} gợi ý
                          </p>
                          <div className="mt-2 h-1 bg-rule">
                            <span
                              className="block h-full bg-cobalt"
                              style={{ width: String(Math.round(ratio * 100)) + "%" }}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 md:justify-end">
                          <button
                            onClick={() =>
                              alert(
                                "Đang chuẩn bị tải xuống bản CV tối ưu cho " +
                                  version.job.title +
                                  "...",
                              )
                            }
                            className="focus-ring flex h-10 w-24 items-center justify-center rounded-[3px] border border-rule bg-paper px-3 text-xs font-semibold text-ink transition-colors hover:border-muted-ink hover:bg-porcelain"
                          >
                            Tải PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("cv-editor", version.job)}
                            className="focus-ring flex h-10 w-24 items-center justify-center rounded-[3px] bg-cobalt px-4 text-xs font-semibold text-white transition-colors hover:bg-cobalt/90"
                          >
                            Mở CV
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </section>

                {totalPages > 1 && (
                  <nav
                    className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-rule pt-6 sm:flex-row"
                    aria-label="Phân trang danh sách CV"
                  >
                    <p className="text-xs text-muted-ink">
                      Hiển thị{" "}
                      <strong className="font-semibold text-ink">
                        {(activePage - 1) * pageSize + 1}–
                        {Math.min(activePage * pageSize, cvVersions.length)}
                      </strong>{" "}
                      trong số <strong className="font-semibold text-ink">{cvVersions.length}</strong> phiên bản CV
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={activePage === 1}
                        onClick={() => setLibraryPage((page) => Math.max(page - 1, 1))}
                        className="focus-ring min-h-10 border border-rule bg-paper px-3 text-xs font-semibold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Trang trước"
                      >
                        ← Trước
                      </button>

                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setLibraryPage(page)}
                          className={`focus-ring flex h-10 w-10 items-center justify-center text-xs font-semibold transition-colors ${
                            activePage === page
                              ? "bg-cobalt text-white"
                              : "border border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
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
                        onClick={() => setLibraryPage((page) => Math.max(page + 1, totalPages))}
                        className="focus-ring min-h-10 border border-rule bg-paper px-3 text-xs font-semibold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Trang sau"
                      >
                        Sau →
                      </button>
                    </div>
                  </nav>
                )}
              </>
            )
          })()}
        </div>
      </div>
    )
  }

  const modifiedCV = cvContent
  const originalLines = originalCV.split("\n")
  const modifiedLines = modifiedCV.split("\n")
  const maxLines = Math.max(originalLines.length, modifiedLines.length)
  let totalChanges = 0

  for (let index = 0; index < maxLines; index += 1) {
    if (originalLines[index] !== modifiedLines[index]) totalChanges += 1
  }

  const recommendations =
    SKILL_RECOMMENDATIONS[job.id] ?? SKILL_RECOMMENDATIONS["1"]

  const saveVersion = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setCvVersions((previous) =>
      previous.map((version) =>
        version.job.id === job.id
          ? {
              ...version,
              status: "completed" as const,
              lastUpdated: "Vừa xong",
              cvContent: modifiedCV,
            }
          : version,
      ),
    )
  }

  const recommendationList = (
    <div className="divide-y divide-rule border-t border-rule">
      {recommendations.map((recommendation) => {
        const priority =
          recommendation.priority === "high"
            ? ["Ưu tiên cao", "text-[#C2413B]", "!"]
            : recommendation.priority === "medium"
              ? ["Ưu tiên vừa", "text-[#9A6700]", "→"]
              : ["Dài hạn", "text-muted-ink", "·"]

        return (
          <section key={recommendation.skill} className="py-5">
            <div className="flex gap-3">
              <span
                className={
                  "flex h-7 w-7 flex-none items-center justify-center border border-rule text-xs font-bold " +
                  priority[1]
                }
                aria-hidden="true"
              >
                {priority[2]}
              </span>
              <div>
                <p
                  className={
                    "text-[10px] font-bold uppercase tracking-[0.12em] " +
                    priority[1]
                  }
                >
                  {priority[0]} · {recommendation.timeEstimate}
                </p>
                <h3 className="mt-2 text-sm font-bold text-ink">
                  {recommendation.skill}
                </h3>
                <p className="mt-2 text-xs leading-5 text-muted-ink">
                  {recommendation.reason}
                </p>
                <p className="mt-3 border-l-2 border-cobalt pl-3 text-xs font-semibold leading-5 text-ink">
                  {recommendation.action}
                </p>
                <details className="mt-3">
                  <summary className="focus-ring cursor-pointer text-[11px] font-semibold text-cobalt">
                    {recommendation.resources.length} tài nguyên đề xuất
                  </summary>
                  <ul className="mt-2 text-[11px] leading-5 text-muted-ink">
                    {recommendation.resources.map((resource) => (
                      <li key={resource}>— {resource}</li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-porcelain">
      <div className="flex min-w-0 flex-none flex-col">
        <header className="flex flex-col gap-4 border-b border-rule bg-paper px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => onNavigate("cv-editor", null)}
              className="focus-ring text-xs font-semibold text-muted-ink hover:text-cobalt"
            >
              ← Thư viện CV
            </button>
            <h1 className="mt-2 font-editorial text-3xl text-ink">
              {displayJob.title}
            </h1>
            <p className="mt-1 text-xs font-semibold text-cobalt">
              {displayJob.company}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-rule bg-porcelain px-3 py-2 text-xs font-semibold text-ink">
              {totalChanges} dòng thay đổi
            </span>
            <button
              onClick={saveVersion}
              className="focus-ring min-h-10 border border-rule px-4 text-xs font-semibold text-ink"
            >
              Lưu phiên bản
            </button>
            <button
              onClick={() =>
                alert("Đang xuất file PDF cho " + displayJob.company + "...")
              }
              className="focus-ring min-h-10 bg-cobalt px-4 text-xs font-semibold text-white"
            >
              Tải PDF
            </button>
          </div>
        </header>

        {saved && (
          <div
            role="status"
            className="border-b border-sage bg-sage px-5 py-3 text-xs font-semibold text-ink"
          >
            Đã lưu phiên bản CV hoàn chỉnh.
          </div>
        )}

        <div className="hidden">
          <div
            role="tablist"
            aria-label="Nội dung chỉnh sửa CV"
            className="flex"
          >
            {[
              ["content", "Nội dung CV"],
              ["suggestions", "Gợi ý chỉnh sửa (" + pending.length + ")"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab as "content" | "suggestions")}
                className={
                  "focus-ring mr-6 min-h-12 border-b-2 text-xs font-semibold " +
                  (activeTab === tab
                    ? "border-cobalt text-cobalt"
                    : "border-transparent text-muted-ink")
                }
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              setDiffView(diffView === "cv-diff" ? null : "cv-diff")
            }
            className="focus-ring text-xs font-semibold text-muted-ink"
            aria-pressed={diffView === "cv-diff"}
          >
            {diffView === "cv-diff" ? "Ẩn đối chiếu" : "Đối chiếu bản gốc"}
          </button>
        </div>

        <div className="hidden">
          {activeTab === "content" ? (
            <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-7">
              <section className="grid gap-6 lg:grid-cols-[180px_1fr]">
                <div>
                  <p className="editorial-kicker">Editable folio</p>
                  <h2 className="mt-2 font-editorial text-3xl text-ink">
                    Nội dung CV
                  </h2>
                  <p className="mt-3 text-xs leading-5 text-muted-ink">
                    Chỉnh trực tiếp nội dung. Các gợi ý đã áp dụng xuất hiện
                    ngay trên trang này.
                  </p>
                  <p className="mt-5 border-l-2 border-cobalt pl-3 text-xs text-muted-ink">
                    {applied.length} gợi ý đã áp dụng
                  </p>
                </div>
                <textarea
                  value={cvContent}
                  onChange={(event) => setCvContent(event.target.value)}
                  aria-label="Nội dung CV có thể chỉnh sửa"
                  spellCheck={false}
                  className="focus-ring min-h-[680px] w-full resize-y border border-rule bg-paper px-7 py-8 font-mono text-[12px] leading-7 text-ink shadow-[0_12px_35px_rgba(17,24,39,0.05)]"
                />
              </section>

              {diffView === "cv-diff" && (
                <section className="mt-8 border-t border-rule pt-7">
                  <p className="editorial-kicker">Version comparison</p>
                  <div className="mt-4 grid gap-px bg-rule lg:grid-cols-2">
                    {[
                      ["CV gốc", originalCV],
                      ["Bản đang chỉnh", modifiedCV],
                    ].map(([label, content]) => (
                      <div key={label} className="bg-paper p-5">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-cobalt">
                          {label}
                        </p>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-6 text-ink">
                          {content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-7">
              <div className="grid gap-7 lg:grid-cols-[190px_1fr]">
                <div>
                  <p className="editorial-kicker">Evidence-led edits</p>
                  <h2 className="mt-2 font-editorial text-3xl text-ink">
                    Gợi ý chỉnh sửa
                  </h2>
                  <p className="mt-3 text-xs leading-5 text-muted-ink">
                    Nhãn văn bản phân biệt gợi ý an toàn, cần dữ kiện và chưa đủ
                    bằng chứng.
                  </p>
                </div>
                <div className="border-t border-rule">
                  {suggestions.map((suggestion) => {
                    const config = TYPE_CONFIG[suggestion.type]
                    const isOpen = diffView === suggestion.id

                    return (
                      <article
                        key={suggestion.id}
                        className="border-b border-l-2 border-b-rule py-5 pl-5"
                        style={{ borderLeftColor: config.border }}
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: config.text }}
                            >
                              {config.label}
                            </p>
                            <h3 className="mt-2 text-sm font-bold text-ink">
                              {suggestion.section}
                            </h3>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-ink">
                            {suggestion.status === "applied"
                              ? "Đã áp dụng ✓"
                              : suggestion.status === "rejected"
                                ? "Đã bỏ qua"
                                : "Đang chờ"}
                          </span>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted-ink">
                          {suggestion.rationale}
                        </p>
                        <button
                          onClick={() =>
                            setDiffView(isOpen ? null : suggestion.id)
                          }
                          className="focus-ring mt-3 text-xs font-semibold text-cobalt"
                          aria-expanded={isOpen}
                        >
                          {isOpen
                            ? "Ẩn nội dung đề xuất"
                            : "Xem trước thay đổi"}
                        </button>
                        {isOpen && (
                          <div className="mt-4 grid gap-px bg-rule sm:grid-cols-2">
                            <div className="bg-porcelain p-4 text-xs leading-5 text-muted-ink">
                              <strong className="block text-[10px] uppercase">
                                Trước
                              </strong>
                              {suggestion.before || "Chưa có nội dung"}
                            </div>
                            <div className="bg-sage/45 p-4 text-xs leading-5 text-ink">
                              <strong className="block text-[10px] uppercase text-[#27633B]">
                                Đề xuất
                              </strong>
                              {suggestion.after}
                            </div>
                          </div>
                        )}
                        {suggestion.status === "pending" && (
                          <div className="mt-4 flex gap-2">
                            <button
                              onClick={() => reject(suggestion.id)}
                              className="focus-ring min-h-10 border border-rule px-4 text-xs font-semibold text-muted-ink"
                            >
                              Bỏ qua
                            </button>
                            <button
                              onClick={() => apply(suggestion.id)}
                              className="focus-ring min-h-10 bg-cobalt px-4 text-xs font-semibold text-white"
                            >
                              Áp dụng gợi ý
                            </button>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </div>
              <section className="mt-9 border-t border-rule pt-7 xl:hidden">
                <p className="editorial-kicker">Skill roadmap</p>
                <h2 className="mt-2 font-editorial text-3xl text-ink">
                  Khuyến nghị phát triển
                </h2>
                <div className="mt-5">{recommendationList}</div>
              </section>
            </div>
          )}
        </div>
      </div>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-porcelain px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="editorial-kicker">CV comparison</p>
              <h2 className="mt-1 font-editorial text-3xl text-ink">Đối chiếu hai phiên bản CV</h2>
            </div>
            <span className="text-xs text-muted-ink">Bấm một dòng để đồng bộ hai bên</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { title: "CV bản gốc", contentKey: "original" as const, paneRef: originalPaneRef },
              { title: "CV đã chỉnh sửa", contentKey: "edited" as const, paneRef: editedPaneRef },
            ].map(({ title, contentKey, paneRef }) => (
              <div key={contentKey} className="min-w-0 border border-rule bg-paper">
                <div className="border-b border-rule px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-cobalt">{title}</p>
                </div>
                {contentKey === "original" && !originalCV ? (
                  <div className="grid min-h-[420px] place-items-center px-6 text-center text-sm text-muted-ink">
                    Chưa có CV gốc để đối chiếu
                  </div>
                ) : (
                  <div ref={paneRef} className="max-h-[560px] overflow-y-auto p-3">
                    {comparisonRows.map((row) => {
                      const text = row[contentKey]
                      const isActive = selectedRowId === row.id
                      const isChanged = row.kind !== "unchanged"
                      const isEmpty = text === null
                      return (
                        <button
                          key={`${contentKey}-${row.id}`}
                          type="button"
                          onClick={() => selectComparisonRow(row)}
                          className={`focus-ring mb-1 flex min-h-10 w-full items-start gap-3 border-l-2 px-3 py-2 text-left text-xs leading-5 transition-colors ${isActive ? "border-cobalt bg-cobalt/10" : isChanged ? "border-amber-400 bg-amber-50" : "border-transparent hover:bg-porcelain"}`}
                          aria-pressed={isActive}
                        >
                          <span className="w-5 shrink-0 text-right text-[10px] text-muted-ink">{(row[contentKey === "edited" ? "editedIndex" : "originalIndex"] ?? 0) + 1}</span>
                          <span
                            className="min-w-0 flex-1 whitespace-pre-wrap text-ink"
                            style={{ fontFamily: '"Times New Roman", Times, serif' }}
                          >
                            {isEmpty ? "—" : text}
                          </span>
                          {row.kind !== "unchanged" && contentKey === "edited" ? <span className={`shrink-0 text-[9px] font-bold uppercase ${row.kind === "added" ? "text-emerald-700" : row.kind === "removed" ? "text-red-700" : "text-cobalt"}`}>{CHANGE_LABELS[row.kind]}</span> : null}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <section className="mt-6 border-t border-rule pt-6">
            <p className="editorial-kicker">Gợi ý phát triển</p>
            <h2 className="mt-1 font-editorial text-3xl text-ink">Kỹ năng và chứng chỉ nên bổ sung</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {recommendations.map((recommendation) => (
                <article key={recommendation.skill} className="border border-rule bg-paper p-4">
                  <h3 className="font-semibold text-ink">{recommendation.skill}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">{recommendation.reason}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>


    </div>
  )
}
