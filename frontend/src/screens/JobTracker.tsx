import { useState } from "react"

import { JOBS } from "../data"
import type { Job, Screen } from "../types"

interface SavedJobsProps {
  onNavigate: (screen: Screen, job?: Job, origin?: "saved") => void
}

const SAVED_JOBS = JOBS.slice(0, 8).map((job, index) => ({
  ...job,
  deadline:
    index === 0
      ? "15/08/2024"
      : index === 1
        ? "20/08/2024"
        : index === 4
          ? "28/08/2024"
          : null,
  cvUsed: "CV_NguyenMinhTuan_2024.pdf",
  lastActivity: String((index % 4) + 1) + " ngày trước",
  notes:
    index === 0
      ? "Cần chuẩn bị portfolio React và câu hỏi về kiến trúc"
      : index === 3
        ? "Nghiên cứu thêm về hệ thống thanh toán và quy trình bảo mật"
        : "",
  nextAction:
    index === 0
      ? "Chỉnh CV trước thứ 6"
      : index === 2
        ? "Chuẩn bị cho vòng kỹ thuật"
        : index === 5
          ? "Gửi thư ứng tuyển trước hạn chót"
          : "",
}))

export default function SavedJobs({ onNavigate }: SavedJobsProps) {
  const [jobs] = useState(SAVED_JOBS)
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(SAVED_JOBS.map((job) => [job.id, job.notes])),
  )
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4

  const totalPages = Math.ceil(jobs.length / pageSize)
  const activePage = Math.min(currentPage, totalPages || 1)
  const paginatedJobs = jobs.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  )

  return (
    <div className="flex-1 overflow-y-auto bg-porcelain">
      <div className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:py-8">
        <header className="border-b border-rule pb-4">
          <p className="editorial-kicker">Saved opportunities</p>
          <h1 className="editorial-title mt-2">Việc làm đã lưu</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-ink">
            Nơi lưu trữ và quản lý {jobs.length} cơ hội bạn đang quan tâm, sẵn sàng để phân tích CV–JD và chuẩn bị ứng tuyển.
          </p>
        </header>

        <section className="mt-7 border-y border-rule bg-paper">
          <div className="hidden grid-cols-[minmax(280px,1.6fr)_minmax(200px,1.2fr)_300px] gap-6 border-b border-rule px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-ink lg:grid">
            <span>Vị trí</span>
            <span>Ghi chú & việc tiếp theo</span>
            <span className="sr-only">Thao tác</span>
          </div>

          <div className="divide-y divide-rule">
            {paginatedJobs.map((job) => (
              <article
                key={job.id}
                className="grid gap-6 px-5 py-6 transition-colors hover:bg-porcelain/60 lg:grid-cols-[minmax(280px,1.6fr)_minmax(200px,1.2fr)_300px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onNavigate("jd-detail", job, "saved")}
                      className="focus-ring text-left text-sm font-bold text-ink hover:text-cobalt"
                    >
                      {job.title}
                    </button>
                    {job.deadline && (
                      <span className="border border-[#F2D28B] bg-[#FFF8E7] px-2 py-0.5 text-[10px] font-semibold text-[#8A5A00]">
                        Hạn {job.deadline}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-ink">
                    {job.company} · {job.location}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-ink">
                    {job.source} · CV: {job.cvUsed} · Cập nhật{" "}
                    {job.lastActivity}
                  </p>
                </div>

                <div className="min-w-0">
                  {editingNote === job.id ? (
                    <div>
                      <label className="sr-only" htmlFor={"note-" + job.id}>
                        Ghi chú cho {job.title}
                      </label>
                      <textarea
                        id={"note-" + job.id}
                        value={notes[job.id] || ""}
                        onChange={(event) =>
                          setNotes((previous) => ({
                            ...previous,
                            [job.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="focus-ring w-full resize-none border border-cobalt bg-paper p-3 text-xs text-ink"
                        placeholder="Ghi chú về vị trí này..."
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingNote(null)}
                        className="focus-ring mt-2 text-xs font-semibold text-cobalt"
                      >
                        Lưu ghi chú
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingNote(job.id)}
                      className="focus-ring text-left text-xs leading-5 text-muted-ink hover:text-ink"
                    >
                      {notes[job.id]
                        ? "Ghi chú: " + notes[job.id]
                        : "+ Thêm ghi chú"}
                    </button>
                  )}
                  {job.nextAction && (
                    <p className="mt-3 border-l-2 border-cobalt pl-3 text-xs font-semibold leading-5 text-ink">
                      Tiếp theo: {job.nextAction}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <button
                    onClick={() => onNavigate("job-detail", job, "saved")}
                    className="focus-ring flex min-h-11 w-36 items-center justify-center rounded-[3px] bg-cobalt px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cobalt/90 active:bg-cobalt/80 whitespace-nowrap shadow-xs"
                  >
                    Phân tích CV–JD
                  </button>
                  <button
                    onClick={() => onNavigate("jd-detail", job, "saved")}
                    className="focus-ring flex min-h-11 w-36 items-center justify-center rounded-[3px] border border-rule bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-muted-ink hover:bg-porcelain active:bg-porcelain/80 whitespace-nowrap"
                  >
                    Xem JD
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {totalPages > 1 && (
          <nav
            className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-rule pt-6 sm:flex-row"
            aria-label="Phân trang việc làm đã lưu"
          >
            <p className="text-xs text-muted-ink">
              Hiển thị{" "}
              <strong className="font-semibold text-ink">
                {(activePage - 1) * pageSize + 1}–
                {Math.min(activePage * pageSize, jobs.length)}
              </strong>{" "}
              trong số <strong className="font-semibold text-ink">{jobs.length}</strong> việc làm đã lưu
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                className="focus-ring min-h-10 border border-rule bg-paper px-3 text-xs font-semibold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                ← Trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
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
                onClick={() => setCurrentPage((page) => Math.max(page + 1, totalPages))}
                className="focus-ring min-h-10 border border-rule bg-paper px-3 text-xs font-semibold text-ink transition-colors hover:border-cobalt hover:text-cobalt disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                Sau →
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
