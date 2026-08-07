import { getDb } from './db'

export type Action = 'create' | 'read' | 'update' | 'delete'
export type Resource = 'institution' | 'trainer' | 'resource' | 'internship' | 'certification' | 'placement'

export function checkPermission(role: string, action: Action, resource: Resource): boolean {
  // Simple role-based access control (RBAC)
  const permissions: Record<string, Record<string, Action[]>> = {
    'institution-admin': {
      institution: ['read', 'update'],
      trainer: ['create', 'read', 'update', 'delete'],
      resource: ['create', 'read', 'update', 'delete'],
      internship: ['create', 'read', 'update', 'delete'],
      certification: ['create', 'read', 'update', 'delete'],
      placement: ['create', 'read', 'update', 'delete'],
    },
    'placement-admin': {
      internship: ['create', 'read', 'update', 'delete'],
      placement: ['create', 'read', 'update', 'delete'],
      trainer: ['read'],
      resource: ['read'],
    },
    'trainer': {
      trainer: ['read', 'update'], // can update own profile
      resource: ['read'], // can book resources
      placement: ['read'], // read-only access to placements assigned to them
    },
    'student': {
      internship: ['read'],
      certification: ['create', 'read'], // can upload certs
      placement: ['read'], // can see their own status
      resource: ['read'],
    }
  }

  const rolePerms = permissions[role]
  if (!rolePerms) return false

  const resourcePerms = rolePerms[resource]
  if (!resourcePerms) return false

  return resourcePerms.includes(action)
}

export function logAudit(institutionId: number | null, userId: number, action: string, resource: string, details?: string) {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO audit_logs (institution_id, user_id, action, resource, details)
      VALUES (?, ?, ?, ?, ?)
    `)
    stmt.run(institutionId, userId, action, resource, details || null)
  } catch (error) {
    console.error('Failed to write audit log:', error)
  }
}
