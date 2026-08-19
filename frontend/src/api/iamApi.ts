/**
 * IAM (Identity & Access Management) API Client
 * Connects directly to NestJS backend for User, Role, and Permission CRUD
 */

import { authApi } from "./authApi"
import type { Role, Permission, IAMUser } from "../types"

const BASE_URL = "" // Uses Vite Proxy

function getAuthHeaders() {
  const token = authApi.getAccessToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  return headers
}

export const iamApi = {
  // ================= ROLES =================
  async getRoles(): Promise<Role[]> {
    const res = await fetch(`${BASE_URL}/roles`, {
      method: "GET",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch roles")
    const data = await res.json()
    return data.map((item: any) => ({
      id: `role-${item.roleID}`,
      rawId: item.roleID,
      name: item.roleName,
      description: item.description || "",
      isSystem: item.roleName === "Admin" || item.roleName === "User",
      userCount: 0,
      permissionIds: (item.rolePermissions || []).map((rp: any) => `perm-${rp.permissionID}`),
      createdAt: item.createdAt || "Hôm nay",
    }))
  },

  async createRole(role: { name: string; description: string; permissionIds?: string[] }): Promise<Role> {
    const res = await fetch(`${BASE_URL}/roles`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        roleName: role.name,
        description: role.description,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || "Failed to create role")
    }
    const item = await res.json()
    return {
      id: `role-${item.roleID}`,
      rawId: item.roleID,
      name: item.roleName,
      description: item.description || "",
      isSystem: false,
      userCount: 0,
      permissionIds: role.permissionIds || [],
      createdAt: "Vừa tạo",
    }
  },

  async updateRole(id: number | string, role: { name?: string; description?: string }): Promise<void> {
    const numericId = typeof id === "string" ? id.replace("role-", "") : id
    const res = await fetch(`${BASE_URL}/roles/${numericId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        roleName: role.name,
        description: role.description,
      }),
    })
    if (!res.ok) throw new Error("Failed to update role")
  },

  async deleteRole(id: number | string): Promise<void> {
    const numericId = typeof id === "string" ? id.replace("role-", "") : id
    const res = await fetch(`${BASE_URL}/roles/${numericId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to delete role")
  },

  // ================= PERMISSIONS =================
  async getPermissions(): Promise<Permission[]> {
    const res = await fetch(`${BASE_URL}/permission`, {
      method: "GET",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch permissions")
    const data = await res.json()
    return data.map((item: any) => ({
      id: `perm-${item.permissionID}`,
      rawId: item.permissionID,
      name: item.permissionName,
      description: item.description || "",
      category: item.permissionName.includes("Job") ? "Jobs" : item.permissionName.includes("User") ? "Users" : "System",
      action: "manage",
      resource: item.permissionName,
    }))
  },

  async createPermission(permission: { name: string; description: string }): Promise<Permission> {
    const res = await fetch(`${BASE_URL}/permission`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        permissionName: permission.name,
        description: permission.description,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || "Failed to create permission")
    }
    const item = await res.json()
    return {
      id: `perm-${item.permissionID}`,
      rawId: item.permissionID,
      name: item.permissionName,
      description: item.description || "",
      category: "Custom",
      action: "manage",
      resource: item.permissionName,
    }
  },

  async updatePermission(id: number | string, permission: { name?: string; description?: string }): Promise<void> {
    const numericId = typeof id === "string" ? id.replace("perm-", "") : id
    const res = await fetch(`${BASE_URL}/permission/${numericId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        permissionName: permission.name,
        description: permission.description,
      }),
    })
    if (!res.ok) throw new Error("Failed to update permission")
  },

  async deletePermission(id: number | string): Promise<void> {
    const numericId = typeof id === "string" ? id.replace("perm-", "") : id
    const res = await fetch(`${BASE_URL}/permission/${numericId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to delete permission")
  },

  // ================= USERS =================
  async getUsers(): Promise<IAMUser[]> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch users")
    const data = await res.json()
    return data.map((item: any) => ({
      id: item.userID,
      name: item.username || item.email.split("@")[0],
      email: item.email,
      role: item.email.toLowerCase().includes("admin") ? "Admin" : "Candidate / Job Seeker",
      roleId: item.email.toLowerCase().includes("admin") ? "role-admin" : "role-candidate",
      status: item.accountStatus === "Active" ? "active" : "inactive",
      department: "JobMatch Platform",
      lastActive: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "Hôm nay",
      createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Hôm nay",
      directPermissions: [],
    }))
  },

  async createUser(user: { email: string; username: string; password?: string }): Promise<IAMUser> {
    const res = await fetch(`${BASE_URL}/users`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: user.email,
        username: user.username.replace(/\s+/g, "_"),
        password: user.password || "Password123@",
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || "Failed to create user")
    }
    const item = await res.json()
    return {
      id: item.userID,
      name: item.username,
      email: item.email,
      role: "Candidate / Job Seeker",
      roleId: "role-candidate",
      status: "active",
      department: "Platform User",
      lastActive: "Vừa xong",
      createdAt: "Hôm nay",
      directPermissions: [],
    }
  },

  async updateUser(id: string, user: { email?: string; username?: string; status?: string }): Promise<void> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email: user.email,
        username: user.username,
        accountStatus: user.status === "active" ? "Active" : "Inactive",
      }),
    })
    if (!res.ok) throw new Error("Failed to update user")
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/users/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to delete user")
  },
}
