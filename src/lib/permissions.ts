export type Action = 'create' | 'read' | 'update' | 'delete'
export type Resource =
  | 'institution'
  | 'trainer'
  | 'resource'
  | 'internship'
  | 'certification'
  | 'placement'
  | 'course'
  | 'assignment'
  | 'quiz'
  | 'announcement'
  | 'discussion'
  | 'certificate'
  | 'ai_learning'
  | 'ai_tools'
  | 'analytics'
  | 'placement_intelligence'
  | 'skill_profile'

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
      course: ['create', 'read', 'update', 'delete'],
      assignment: ['create', 'read', 'update', 'delete'],
      quiz: ['create', 'read', 'update', 'delete'],
      announcement: ['create', 'read', 'update', 'delete'],
      discussion: ['create', 'read', 'update', 'delete'],
      certificate: ['create', 'read', 'update', 'delete'],
      ai_learning: ['create', 'read', 'update', 'delete'],
      ai_tools: ['create', 'read', 'update', 'delete'],
      analytics: ['create', 'read', 'update', 'delete'],
      placement_intelligence: ['create', 'read', 'update', 'delete'],
      skill_profile: ['create', 'read', 'update', 'delete'],
    },
    'placement-admin': {
      internship: ['create', 'read', 'update', 'delete'],
      placement: ['create', 'read', 'update', 'delete'],
      trainer: ['read'],
      resource: ['read'],
      course: ['read'],
      assignment: ['read'],
      quiz: ['read'],
      announcement: ['read'],
      discussion: ['read'],
      certificate: ['read'],
      ai_learning: ['read'],
      ai_tools: ['read'],
      analytics: ['read'],
      placement_intelligence: ['create', 'read', 'update'],
      skill_profile: ['read'],
    },
    'trainer': {
      trainer: ['read', 'update'], // can update own profile
      resource: ['read'], // can book resources
      placement: ['read'], // read-only access to placements assigned to them
      course: ['create', 'read', 'update', 'delete'],
      assignment: ['create', 'read', 'update', 'delete'],
      quiz: ['create', 'read', 'update', 'delete'],
      announcement: ['create', 'read', 'update', 'delete'],
      discussion: ['create', 'read', 'update', 'delete'],
      certificate: ['read'],
      ai_learning: ['create', 'read', 'update', 'delete'],
      ai_tools: ['create', 'read', 'update', 'delete'],
      analytics: ['read'],
      placement_intelligence: ['read'],
      skill_profile: ['create', 'read', 'update'],
    },
    'student': {
      internship: ['read'],
      certification: ['create', 'read'], // can upload certs
      placement: ['read'], // can see their own status
      resource: ['read'],
      course: ['read'],
      assignment: ['read', 'create', 'update'],
      quiz: ['read', 'create', 'update'],
      announcement: ['read'],
      discussion: ['create', 'read', 'update', 'delete'],
      certificate: ['read', 'create'],
      ai_learning: ['create', 'read', 'update', 'delete'],
      ai_tools: ['read'],
      analytics: ['read'],
      placement_intelligence: ['read'],
      skill_profile: ['read'],
    }
  }

  const rolePerms = permissions[role]
  if (!rolePerms) return false

  const resourcePerms = rolePerms[resource]
  if (!resourcePerms) return false

  return resourcePerms.includes(action)
}
