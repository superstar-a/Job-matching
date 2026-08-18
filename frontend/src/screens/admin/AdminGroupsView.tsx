import { useState } from "react"
import { IAM_GROUPS_CATALOG, IAM_POLICIES_CATALOG } from "../../iamData"
import type { IAMGroup, IAMUser } from "../../types"

interface AdminGroupsViewProps {
  users: IAMUser[]
  onSelectUser: (user: IAMUser) => void
}

export default function AdminGroupsView({
  users,
  onSelectUser,
}: AdminGroupsViewProps) {
  const [selectedGroup, setSelectedGroup] = useState<IAMGroup | null>(IAM_GROUPS_CATALOG[0])

  const groupMembers = selectedGroup
    ? users.filter((u) => u.groups.includes(selectedGroup.name))
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">
          Quản lý Nhóm vai trò (User Groups)
        </h1>
        <p className="mt-1 text-xs text-muted-ink">
          Định nghĩa vai trò và tập hợp quyền hạn mặc định. Thành viên trong nhóm tự động thừa hưởng toàn bộ chính sách quyền hạn tương ứng.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left List of Groups */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-ink">
            Danh sách nhóm ({IAM_GROUPS_CATALOG.length})
          </h2>
          <div className="space-y-2">
            {IAM_GROUPS_CATALOG.map((group) => {
              const isSelected = selectedGroup?.id === group.id
              const count = users.filter((u) => u.groups.includes(group.name)).length
              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`rounded-[6px] border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-cobalt bg-cobalt/5 shadow-xs"
                      : "border-rule bg-paper hover:bg-porcelain/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-ink">{group.name}</h3>
                    <span className="rounded-[3px] bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      {count} thành viên
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-ink line-clamp-2">
                    {group.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {group.attachedPolicies.map((pol) => (
                      <span
                        key={pol}
                        className="rounded-[3px] bg-paper border border-rule px-1.5 py-0.2 text-[10px] font-mono text-cobalt"
                      >
                        {pol}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Details of Selected Group */}
        {selectedGroup && (
          <div className="rounded-[6px] border border-rule bg-paper p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">{selectedGroup.name}</h2>
                <span className="rounded-[3px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Hoạt động
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-ink">{selectedGroup.description}</p>
            </div>

            {/* Attached Policies for this Group */}
            <div className="space-y-3 border-t border-rule pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-ink">
                Chính sách được gán ({selectedGroup.attachedPolicies.length})
              </h3>
              <div className="space-y-2">
                {selectedGroup.attachedPolicies.map((polName) => {
                  const policy = IAM_POLICIES_CATALOG.find((p) => p.name === polName)
                  return (
                    <div
                      key={polName}
                      className="flex items-start justify-between rounded border border-rule p-3 bg-porcelain/30 text-xs"
                    >
                      <div>
                        <p className="font-bold font-mono text-cobalt">{polName}</p>
                        <p className="text-[11px] text-muted-ink mt-0.5">
                          {policy?.description || "Chính sách quyền hạn"}
                        </p>
                      </div>
                      <span className="rounded-[3px] bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                        {policy?.category || "Quyền hạn"}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Member Users */}
            <div className="space-y-3 border-t border-rule pt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-ink">
                Thành viên trong nhóm ({groupMembers.length})
              </h3>
              <div className="divide-y divide-rule border border-rule rounded-[4px] overflow-hidden">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 hover:bg-porcelain/50 bg-paper transition-colors"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectUser(member)}
                        className="text-xs font-bold text-cobalt hover:underline text-left block"
                      >
                        {member.userName}
                      </button>
                      <span className="text-[11px] text-muted-ink">{member.email}</span>
                    </div>
                    <span className="text-[11px] text-muted-ink font-mono">
                      Hoạt động {member.lastActivity}
                    </span>
                  </div>
                ))}

                {groupMembers.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-ink">
                    Chưa có người dùng nào thuộc nhóm vai trò này.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
