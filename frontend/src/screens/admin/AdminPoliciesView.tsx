import { useState } from "react"
import { IAM_POLICIES_CATALOG } from "../../iamData"
import type { IAMPolicy } from "../../types"

export default function AdminPoliciesView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPolicy, setSelectedPolicy] = useState<IAMPolicy | null>(null)

  const filtered = IAM_POLICIES_CATALOG.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">
            Chính sách Phân quyền (Permission Policies)
          </h1>
          <p className="mt-1 text-xs text-muted-ink">
            Danh mục các chính sách quyền hạn quy định phạm vi hành động được phép hoặc bị từ chối trên hệ thống.
          </p>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm chính sách theo tên, danh mục..."
          className="focus-ring h-9 w-72 rounded-[4px] border border-rule bg-paper px-3 text-xs outline-none focus:border-cobalt"
        />
      </div>

      {/* Policies Table */}
      <div className="rounded-[6px] border border-rule bg-paper shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-rule bg-porcelain/60 font-semibold text-muted-ink">
              <th className="px-4 py-3">Tên chính sách (Policy Name)</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Mô tả quyền hạn</th>
              <th className="px-4 py-3">Hành động cho phép (Actions)</th>
              <th className="px-4 py-3 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule bg-paper text-ink">
            {filtered.map((policy) => (
              <tr key={policy.id} className="hover:bg-porcelain/40">
                <td className="px-4 py-3 font-bold font-mono text-cobalt">
                  {policy.name}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-[3px] bg-porcelain px-2 py-0.5 text-[10px] text-muted-ink border border-rule">
                    {policy.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-[3px] bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    {policy.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-[11px] text-muted-ink max-w-xs">
                  {policy.description}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {policy.actions.map((act) => (
                      <span
                        key={act}
                        className="rounded-[3px] bg-porcelain border border-rule px-1.5 py-0.2 text-[10px] font-mono text-ink"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedPolicy(policy)}
                    className="text-xs font-semibold text-cobalt hover:underline"
                  >
                    Xem JSON
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policy JSON Inspector Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-[6px] bg-paper p-6 shadow-2xl space-y-4 border border-rule">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div>
                <h2 className="text-sm font-bold font-mono text-cobalt">
                  {selectedPolicy.name}
                </h2>
                <p className="text-xs text-muted-ink mt-0.5">
                  Cấu trúc phân quyền JSON Document
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="text-xs text-muted-ink hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="rounded-[4px] bg-[#0F172A] p-4 text-emerald-400 font-mono text-xs overflow-x-auto leading-5 shadow-inner">
              <pre>
{JSON.stringify(
  {
    Version: "2026-08-18",
    Statement: [
      {
        Sid: `${selectedPolicy.name}Statement`,
        Effect: "Allow",
        Action: selectedPolicy.actions,
        Resource: "*",
      },
    ],
  },
  null,
  2,
)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="rounded-[4px] bg-cobalt px-4 py-2 text-xs font-semibold text-white hover:bg-cobalt/90"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
