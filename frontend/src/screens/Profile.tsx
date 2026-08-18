import { useState } from "react"

import { CV_DATA } from "../data"

const PROFILE_SECTIONS = [
  {
    title: "Thông tin cơ bản",
    description: "Thông tin liên hệ và định vị nghề nghiệp hiện tại.",
    fields: [
      { label: "Họ tên", value: "Nguyễn Minh Tuấn", source: "cv" as const },
      { label: "Email", value: "tuannm@gmail.com", source: "cv" as const },
      { label: "Số điện thoại", value: "0912 345 678", source: "cv" as const },
      { label: "Địa điểm", value: "TP. Hồ Chí Minh", source: "cv" as const },
      {
        label: "Vị trí hiện tại",
        value: "Senior Frontend Developer",
        source: "cv" as const,
      },
      {
        label: "Trình độ tiếng Anh",
        value: "B2 (CEFR)",
        source: "inferred" as const,
      },
    ],
  },
  {
    title: "Kinh nghiệm làm việc",
    description: "Lịch sử vai trò dùng để đối chiếu với yêu cầu tuyển dụng.",
    fields: [
      {
        label: "VNG Corporation",
        value: "Senior Frontend Developer · 2022 – nay",
        source: "cv" as const,
      },
      {
        label: "Axon Active Vietnam",
        value: "Frontend Developer · 2020 – 2022",
        source: "cv" as const,
      },
      {
        label: "Nashtech Global",
        value: "Junior Developer · 2019 – 2020",
        source: "cv" as const,
      },
    ],
  },
  {
    title: "Học vấn",
    description: "Nền tảng học thuật được nhận diện trong CV.",
    fields: [
      {
        label: "Đại học Bách Khoa TP.HCM",
        value: "Kỹ sư Công nghệ Thông tin · 2015 – 2019",
        source: "cv" as const,
      },
    ],
  },
]

type Source = "cv" | "confirmed" | "inferred"

const SOURCE_BADGE: Record<Source, { label: string className: string }> = {
  cv: {
    label: "Từ CV",
    className: "border-rule bg-porcelain text-muted-ink",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "border-sage bg-sage text-ink",
  },
  inferred: {
    label: "AI suy luận",
    className: "border-[#F2D28B] bg-[#FFF8E7] text-[#8A5A00]",
  },
}

import type { Screen } from "../types"

interface ProfileProps {
  onNavigate?: (screen: Screen) => void
}

export default function Profile({ onNavigate }: ProfileProps) {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  const confirm = (key: string) => {
    setConfirmed((previous) => new Set([...previous, key]))
  }

  const pendingInferredCount = PROFILE_SECTIONS.reduce(
    (count, section) =>
      count +
      section.fields.filter(
        (field) =>
          field.source === "inferred" &&
          !confirmed.has(section.title + "-" + field.label),
      ).length,
    0,
  )

  return (
    <div className="flex-1 overflow-y-auto bg-porcelain">
      <div className="mx-auto w-full max-w-5xl px-5 py-7 sm:px-8 lg:py-8">
        <header className="grid gap-4 border-b border-rule pb-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="editorial-kicker">Career profile</p>
            <h1 className="editorial-title mt-2">Hồ sơ nghề nghiệp</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-ink">
              Một nguồn dữ liệu duy nhất cho phân tích công việc, gợi ý AI và
              các phiên bản CV được cá nhân hóa.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            {onNavigate && (
              <button
                onClick={() => onNavigate("auth")}
                className="focus-ring min-h-11 border border-rule bg-paper px-4 text-xs font-semibold text-muted-ink hover:border-red-500 hover:text-red-600 transition-colors"
                title="Chuyển đến màn hình Đăng nhập / Đăng ký"
              >
                Đăng xuất
              </button>
            )}
            <button className="focus-ring min-h-11 border border-rule bg-paper px-5 text-sm font-semibold text-ink hover:border-muted-ink">
              Tải CV mới
            </button>
          </div>
        </header>

        <section className="grid gap-6 border-b border-rule py-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex items-start gap-4 border-l-2 border-cobalt pl-4">
            <div className="flex h-11 w-11 flex-none items-center justify-center border border-rule bg-paper text-cobalt">
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  d="M5 2.5h7l3 3v12H5v-15Zm7 0v4h4M7.5 10h5M7.5 13h5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">{CV_DATA.fileName}</p>
              <p className="mt-1 text-xs leading-5 text-muted-ink">
                PDF · Tải lên 2 ngày trước · Phân tích hoàn tất
              </p>
              <p className="mt-3 text-xs font-semibold text-[#27633B]">
                Chất lượng trích xuất: Tốt
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between">
              <div>
                <p className="editorial-kicker">Độ hoàn thiện hồ sơ</p>
                <p className="mt-2 text-xs text-muted-ink">
                  Còn thiếu phần tóm tắt nghề nghiệp
                </p>
              </div>
              <span className="font-editorial text-4xl text-cobalt">76%</span>
            </div>
            <div
              className="career-signal mt-4"
              aria-label="Độ hoàn thiện hồ sơ 76%"
            >
              <div className="career-signal__bar">
                <span
                  className="career-signal__fill"
                  style={{ "--signal": 0.76 } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 border-b border-rule py-5 sm:grid-cols-3">
          {[
            ["Kỹ năng đã nhận diện", CV_DATA.skills.length, "kỹ năng"],
            ["Điểm cần cải thiện", CV_DATA.improvements, "gợi ý"],
            ["Dữ kiện cần xác nhận", pendingInferredCount, "mục"],
          ].map(([label, value, suffix]) => (
            <div
              key={label}
              className="border-l border-rule px-4 first:border-l-0 first:pl-0"
            >
              <p className="font-editorial text-3xl text-ink">
                {value}{" "}
                <span className="font-sans text-xs text-muted-ink">
                  {suffix}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-ink">{label}</p>
            </div>
          ))}
        </section>

        <div className="mt-3">
          {PROFILE_SECTIONS.map((section, sectionIndex) => (
            <section
              key={section.title}
              className="grid gap-5 border-b border-rule py-8 md:grid-cols-[190px_1fr]"
            >
              <div>
                <div className="flex items-start justify-between gap-3 md:block">
                  <div>
                    <p className="editorial-kicker">
                      {String(sectionIndex + 1).padStart(2, "0")} · Hồ sơ
                    </p>
                    <h2 className="mt-2 font-editorial text-2xl text-ink">
                      {section.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setEditing(null)
                      setEditingSection((current) =>
                        current === section.title ? null : section.title,
                      )
                    }}
                    className="focus-ring mt-3 min-h-9 text-xs font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4 md:inline-flex"
                    aria-pressed={editingSection === section.title}
                  >
                    {editingSection === section.title ? "Xong" : "Chỉnh sửa"}
                  </button>
                </div>
                <p className="mt-2 max-w-[180px] text-xs leading-5 text-muted-ink">
                  {section.description}
                </p>
              </div>

              <div className="border-t border-rule">
                {section.fields.map((field) => {
                  const fieldKey = section.title + "-" + field.label
                  const isInferred = field.source === "inferred"
                  const isConfirmed = confirmed.has(fieldKey)
                  const effectiveSource: Source =
                    isInferred && isConfirmed ? "confirmed" : field.source
                  const badge = SOURCE_BADGE[effectiveSource]
                  const isEditing =
                    editing === fieldKey || editingSection === section.title

                  return (
                    <div
                      key={field.label}
                      className={
                        "grid gap-2 border-b border-rule py-4 sm:grid-cols-[150px_1fr_auto] sm:items-center " +
                        (isInferred && !isConfirmed
                          ? "bg-[#FFF8E7]/50 px-3"
                          : "")
                      }
                    >
                      <p className="text-xs font-semibold text-muted-ink">
                        {field.label}
                      </p>
                      <div className="min-w-0">
                        {isEditing ? (
                          <input
                            defaultValue={field.value}
                            aria-label={"Chỉnh sửa " + field.label}
                            className="focus-ring min-h-10 w-full border border-cobalt bg-paper px-3 text-sm text-ink"
                            onBlur={() => {
                              if (editingSection !== section.title) {
                                setEditing(null)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <p className="text-sm text-ink">{field.value}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "border px-2 py-1 text-[10px] font-semibold " +
                            badge.className
                          }
                        >
                          {badge.label}
                        </span>
                        {isInferred && !isConfirmed && (
                          <button
                            onClick={() => confirm(fieldKey)}
                            className="focus-ring min-h-9 border border-[#F2D28B] bg-paper px-3 text-[11px] font-semibold text-[#8A5A00]"
                          >
                            Xác nhận
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingSection(null)
                            setEditing(editing === fieldKey ? null : fieldKey)
                          }}
                          className="focus-ring flex h-9 w-9 items-center justify-center text-muted-ink hover:text-cobalt"
                          aria-label={"Chỉnh sửa " + field.label}
                        >
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            viewBox="0 0 14 14"
                            aria-hidden="true"
                          >
                            <path
                              d="m9.75 1.75 2.5 2.5-7.5 7.5h-3v-3l7.5-7.5Z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <section className="grid gap-5 py-8 md:grid-cols-[190px_1fr]">
            <div>
              <p className="editorial-kicker">04 · Năng lực</p>
              <h2 className="mt-2 font-editorial text-2xl text-ink">Kỹ năng</h2>
              <p className="mt-2 max-w-[180px] text-xs leading-5 text-muted-ink">
                Từ khóa chuyên môn được dùng khi đối chiếu với công việc.
              </p>
            </div>
            <div className="flex flex-wrap content-start gap-2 border-t border-rule pt-4">
              {CV_DATA.skills.map((skill) => (
                <span
                  key={skill}
                  className="border border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ink"
                >
                  {skill}
                </span>
              ))}
              <button className="focus-ring border border-dashed border-muted-ink/50 px-3 py-1.5 text-xs font-semibold text-cobalt hover:border-cobalt">
                + Thêm kỹ năng
              </button>
            </div>
          </section>

          <section className="grid gap-5 border-t border-rule py-8 md:grid-cols-[190px_1fr]">
            <div>
              <p className="editorial-kicker">05 · Cài đặt</p>
              <h2 className="mt-2 font-editorial text-2xl text-ink">Tài khoản & Phiên</h2>
              <p className="mt-2 max-w-[180px] text-xs leading-5 text-muted-ink">
                Quản lý phiên đăng nhập và bảo mật thông tin cá nhân.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-rule pt-4 md:border-t-0 md:pt-0">
              <div>
                <p className="text-sm font-semibold text-ink">
                  Đang đăng nhập với <span className="text-cobalt font-bold">tuannm@gmail.com</span>
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  Phiên làm việc hiện tại được bảo mật trong không gian cá nhân.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.("auth")}
                className="focus-ring flex items-center gap-2 rounded-[3px] border border-red-200 bg-red-50/60 px-4 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-100 hover:border-red-300 active:bg-red-200"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
