
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  name: 'name',
  email: 'email',
  password: 'password',
  college: 'college',
  degree: 'degree',
  graduationYear: 'graduationYear',
  phone: 'phone',
  cgpa: 'cgpa',
  tenthMarks: 'tenthMarks',
  twelfthMarks: 'twelfthMarks',
  githubUrl: 'githubUrl',
  linkedinUrl: 'linkedinUrl',
  portfolioUrl: 'portfolioUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  companyName: 'companyName',
  email: 'email',
  password: 'password',
  industry: 'industry',
  website: 'website',
  location: 'location',
  companySize: 'companySize',
  description: 'description',
  contactPerson: 'contactPerson',
  phone: 'phone',
  isOnline: 'isOnline',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResumeScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  filename: 'filename',
  filePath: 'filePath',
  extractedText: 'extractedText',
  analysisData: 'analysisData',
  atsScore: 'atsScore',
  overallRating: 'overallRating',
  createdAt: 'createdAt'
};

exports.Prisma.JobPostingScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  title: 'title',
  description: 'description',
  requiredSkills: 'requiredSkills',
  location: 'location',
  jobType: 'jobType',
  salaryRange: 'salaryRange',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.ApplicationScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  jobId: 'jobId',
  matchScore: 'matchScore',
  status: 'status',
  appliedAt: 'appliedAt'
};

exports.Prisma.SkillAssessmentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  skillName: 'skillName',
  proficiencyLevel: 'proficiencyLevel',
  verified: 'verified',
  createdAt: 'createdAt'
};

exports.Prisma.SkillGapAnalysisScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  resumeName: 'resumeName',
  jobDescName: 'jobDescName',
  analysisData: 'analysisData',
  createdAt: 'createdAt'
};

exports.Prisma.CodingSessionScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  studentId: 'studentId',
  roomId: 'roomId',
  status: 'status',
  score: 'score',
  feedback: 'feedback',
  codeSnapshot: 'codeSnapshot',
  language: 'language',
  startedAt: 'startedAt',
  endedAt: 'endedAt'
};

exports.Prisma.InstitutionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  domain: 'domain',
  contactEmail: 'contactEmail',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TrainerScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  institutionId: 'institutionId',
  expertiseTags: 'expertiseTags',
  subjects: 'subjects',
  bio: 'bio',
  rating: 'rating',
  createdAt: 'createdAt'
};

exports.Prisma.CohortScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  name: 'name',
  description: 'description',
  graduationYear: 'graduationYear',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.ResourceScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  name: 'name',
  type: 'type',
  category: 'category',
  description: 'description',
  location: 'location',
  capacity: 'capacity',
  availability: 'availability',
  facilities: 'facilities',
  status: 'status',
  sharingEnabled: 'sharingEnabled',
  availableToStudents: 'availableToStudents',
  createdAt: 'createdAt'
};

exports.Prisma.ResourceBookingScalarFieldEnum = {
  id: 'id',
  resourceId: 'resourceId',
  bookedByUserId: 'bookedByUserId',
  studentId: 'studentId',
  purpose: 'purpose',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  rejectionReason: 'rejectionReason',
  createdAt: 'createdAt'
};

exports.Prisma.ResourceRequestScalarFieldEnum = {
  id: 'id',
  resourceId: 'resourceId',
  requestingInstitutionId: 'requestingInstitutionId',
  purpose: 'purpose',
  requestedDate: 'requestedDate',
  startTime: 'startTime',
  endTime: 'endTime',
  studentCount: 'studentCount',
  additionalRequirements: 'additionalRequirements',
  status: 'status',
  rejectionReason: 'rejectionReason',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SharingAgreementScalarFieldEnum = {
  id: 'id',
  resourceId: 'resourceId',
  ownerInstitutionId: 'ownerInstitutionId',
  requestingInstitutionId: 'requestingInstitutionId',
  requestId: 'requestId',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResourceSharingNotificationScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  message: 'message',
  read: 'read',
  createdAt: 'createdAt'
};

exports.Prisma.TrainerSessionScalarFieldEnum = {
  id: 'id',
  trainerId: 'trainerId',
  studentId: 'studentId',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status',
  notes: 'notes',
  createdAt: 'createdAt'
};

exports.Prisma.InternshipScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  companyId: 'companyId',
  title: 'title',
  description: 'description',
  location: 'location',
  stipend: 'stipend',
  duration: 'duration',
  minCgpa: 'minCgpa',
  minTenthMarks: 'minTenthMarks',
  minTwelfthMarks: 'minTwelfthMarks',
  deadline: 'deadline',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.InternshipApplicationScalarFieldEnum = {
  id: 'id',
  internshipId: 'internshipId',
  studentId: 'studentId',
  status: 'status',
  appliedAt: 'appliedAt'
};

exports.Prisma.CertificationScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  institutionId: 'institutionId',
  name: 'name',
  provider: 'provider',
  issueDate: 'issueDate',
  credentialUrl: 'credentialUrl',
  verifiedStatus: 'verifiedStatus',
  createdAt: 'createdAt'
};

exports.Prisma.PlacementDriveScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  companyId: 'companyId',
  title: 'title',
  description: 'description',
  eligibilityCriteria: 'eligibilityCriteria',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.PlacementRoundScalarFieldEnum = {
  id: 'id',
  driveId: 'driveId',
  roundName: 'roundName',
  startTime: 'startTime',
  endTime: 'endTime',
  status: 'status'
};

exports.Prisma.PlacementApplicationScalarFieldEnum = {
  id: 'id',
  driveId: 'driveId',
  studentId: 'studentId',
  currentRoundId: 'currentRoundId',
  status: 'status',
  appliedAt: 'appliedAt'
};

exports.Prisma.DocumentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  institutionId: 'institutionId',
  fileName: 'fileName',
  filePath: 'filePath',
  fileType: 'fileType',
  fileSize: 'fileSize',
  documentType: 'documentType',
  category: 'category',
  description: 'description',
  accessLevel: 'accessLevel',
  verificationStatus: 'verificationStatus',
  processingStatus: 'processingStatus',
  qualityScore: 'qualityScore',
  qualityResult: 'qualityResult',
  extractedInformation: 'extractedInformation',
  sha256Hash: 'sha256Hash',
  perceptualHash: 'perceptualHash',
  ocrConfidence: 'ocrConfidence',
  verificationScore: 'verificationScore',
  riskScore: 'riskScore',
  qrStatus: 'qrStatus',
  expiryDate: 'expiryDate',
  version: 'version',
  parentDocumentId: 'parentDocumentId',
  rejectionReason: 'rejectionReason',
  uploadedAt: 'uploadedAt',
  updatedAt: 'updatedAt',
  verifiedAt: 'verifiedAt',
  verifiedBy: 'verifiedBy',
  tamperScore: 'tamperScore',
  faceMatchScore: 'faceMatchScore',
  faceMatchStatus: 'faceMatchStatus',
  aiRiskLevel: 'aiRiskLevel',
  securityLevel: 'securityLevel',
  isEncrypted: 'isEncrypted',
  encryptionIv: 'encryptionIv',
  encryptionTag: 'encryptionTag',
  passwordHash: 'passwordHash',
  isPasswordProtected: 'isPasswordProtected',
  failedPasswordAttempts: 'failedPasswordAttempts',
  isLocked: 'isLocked',
  lockedUntil: 'lockedUntil',
  isViewOnly: 'isViewOnly',
  downloadPolicy: 'downloadPolicy',
  maxDownloads: 'maxDownloads',
  downloadCount: 'downloadCount',
  accessExpiry: 'accessExpiry',
  watermarkEnabled: 'watermarkEnabled',
  watermarkText: 'watermarkText',
  versionNotes: 'versionNotes',
  publicVerificationId: 'publicVerificationId'
};

exports.Prisma.DocumentRequestScalarFieldEnum = {
  id: 'id',
  institutionId: 'institutionId',
  studentId: 'studentId',
  title: 'title',
  reason: 'reason',
  category: 'category',
  status: 'status',
  documentId: 'documentId',
  requestedAt: 'requestedAt',
  completedAt: 'completedAt'
};

exports.Prisma.DocumentProcessingScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  status: 'status',
  stage: 'stage',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  error: 'error',
  metadata: 'metadata'
};

exports.Prisma.OCRResultScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  fullText: 'fullText',
  textBlocks: 'textBlocks',
  boundingBoxes: 'boundingBoxes',
  confidence: 'confidence',
  engine: 'engine',
  language: 'language',
  pageCount: 'pageCount',
  createdAt: 'createdAt'
};

exports.Prisma.ExtractedFieldScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  fieldName: 'fieldName',
  fieldValue: 'fieldValue',
  confidence: 'confidence',
  source: 'source',
  matchedProfileValue: 'matchedProfileValue',
  isConsistent: 'isConsistent'
};

exports.Prisma.DocumentVerificationScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  verificationScore: 'verificationScore',
  riskScore: 'riskScore',
  riskLevel: 'riskLevel',
  status: 'status',
  ocrScore: 'ocrScore',
  fieldScore: 'fieldScore',
  qualityScore: 'qualityScore',
  qrScore: 'qrScore',
  duplicateScore: 'duplicateScore',
  tamperScore: 'tamperScore',
  faceScore: 'faceScore',
  aiScore: 'aiScore',
  reasons: 'reasons',
  warnings: 'warnings',
  explanation: 'explanation',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QRCodeResultScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  codeType: 'codeType',
  rawData: 'rawData',
  certificateId: 'certificateId',
  verificationUrl: 'verificationUrl',
  matchStatus: 'matchStatus',
  matchedWithOcr: 'matchedWithOcr',
  createdAt: 'createdAt'
};

exports.Prisma.DuplicateMatchScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  matchedDocumentId: 'matchedDocumentId',
  matchType: 'matchType',
  similarityScore: 'similarityScore',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.VerificationHistoryScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  changedByUserId: 'changedByUserId',
  oldStatus: 'oldStatus',
  newStatus: 'newStatus',
  score: 'score',
  reason: 'reason',
  changedAt: 'changedAt'
};

exports.Prisma.YOLODetectionScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  objectType: 'objectType',
  confidence: 'confidence',
  boundingBox: 'boundingBox',
  pageNumber: 'pageNumber',
  createdAt: 'createdAt'
};

exports.Prisma.FaceVerificationScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  studentId: 'studentId',
  status: 'status',
  similarityScore: 'similarityScore',
  profilePhotoFound: 'profilePhotoFound',
  documentPhotoFound: 'documentPhotoFound',
  details: 'details',
  createdAt: 'createdAt'
};

exports.Prisma.TamperAnalysisScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  overallRiskLevel: 'overallRiskLevel',
  tamperScore: 'tamperScore',
  elaScore: 'elaScore',
  noiseScore: 'noiseScore',
  edgeInconsistencyScore: 'edgeInconsistencyScore',
  compressionScore: 'compressionScore',
  fontInconsistencyScore: 'fontInconsistencyScore',
  pdfMetadataRiskScore: 'pdfMetadataRiskScore',
  pdfMetadata: 'pdfMetadata',
  summary: 'summary',
  createdAt: 'createdAt'
};

exports.Prisma.TamperSignalScalarFieldEnum = {
  id: 'id',
  tamperAnalysisId: 'tamperAnalysisId',
  signalType: 'signalType',
  severity: 'severity',
  location: 'location',
  description: 'description',
  confidence: 'confidence',
  createdAt: 'createdAt'
};

exports.Prisma.AIAnalysisScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  provider: 'provider',
  modelName: 'modelName',
  riskLevel: 'riskLevel',
  confidence: 'confidence',
  recommendation: 'recommendation',
  fieldConsistencyScore: 'fieldConsistencyScore',
  semanticConsistencyScore: 'semanticConsistencyScore',
  documentTypeConfidence: 'documentTypeConfidence',
  reasoningSummary: 'reasoningSummary',
  createdAt: 'createdAt'
};

exports.Prisma.AIAnalysisEvidenceScalarFieldEnum = {
  id: 'id',
  aiAnalysisId: 'aiAnalysisId',
  evidenceType: 'evidenceType',
  severity: 'severity',
  description: 'description',
  rawProof: 'rawProof',
  createdAt: 'createdAt'
};

exports.Prisma.VerificationStageScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  stageName: 'stageName',
  status: 'status',
  durationMs: 'durationMs',
  details: 'details',
  timestamp: 'timestamp'
};

exports.Prisma.DocumentActivityScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  actorId: 'actorId',
  actorName: 'actorName',
  actorRole: 'actorRole',
  action: 'action',
  details: 'details',
  ip: 'ip',
  location: 'location',
  device: 'device',
  status: 'status',
  timestamp: 'timestamp'
};

exports.Prisma.DocumentShareScalarFieldEnum = {
  id: 'id',
  documentId: 'documentId',
  shareToken: 'shareToken',
  createdByUserId: 'createdByUserId',
  recipientEmail: 'recipientEmail',
  isViewOnly: 'isViewOnly',
  allowDownload: 'allowDownload',
  passwordHash: 'passwordHash',
  maxAccessCount: 'maxAccessCount',
  accessCount: 'accessCount',
  expiresAt: 'expiresAt',
  isRevoked: 'isRevoked',
  createdAt: 'createdAt'
};

exports.Prisma.TrustedDeviceScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  userRole: 'userRole',
  deviceId: 'deviceId',
  browser: 'browser',
  os: 'os',
  deviceType: 'deviceType',
  ip: 'ip',
  location: 'location',
  isTrusted: 'isTrusted',
  trustedAt: 'trustedAt',
  lastUsedAt: 'lastUsedAt',
  createdAt: 'createdAt'
};

exports.Prisma.LoginOtpScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  userRole: 'userRole',
  email: 'email',
  otpHash: 'otpHash',
  purpose: 'purpose',
  challengeToken: 'challengeToken',
  deviceId: 'deviceId',
  browser: 'browser',
  os: 'os',
  ip: 'ip',
  location: 'location',
  attemptCount: 'attemptCount',
  maxAttempts: 'maxAttempts',
  isUsed: 'isUsed',
  usedAt: 'usedAt',
  expiresAt: 'expiresAt',
  resendCount: 'resendCount',
  lastResentAt: 'lastResentAt',
  trustDevice: 'trustDevice',
  createdAt: 'createdAt'
};

exports.Prisma.LoginAuditScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  userRole: 'userRole',
  email: 'email',
  action: 'action',
  status: 'status',
  riskLevel: 'riskLevel',
  riskScore: 'riskScore',
  riskReason: 'riskReason',
  deviceId: 'deviceId',
  browser: 'browser',
  os: 'os',
  deviceType: 'deviceType',
  ip: 'ip',
  location: 'location',
  details: 'details',
  timestamp: 'timestamp'
};

exports.Prisma.CourseCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
  createdAt: 'createdAt'
};

exports.Prisma.CourseScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  description: 'description',
  thumbnail: 'thumbnail',
  categoryId: 'categoryId',
  trainerId: 'trainerId',
  institutionId: 'institutionId',
  difficulty: 'difficulty',
  estimatedDuration: 'estimatedDuration',
  learningObjectives: 'learningObjectives',
  prerequisites: 'prerequisites',
  status: 'status',
  joinCode: 'joinCode',
  joinCodeEnabled: 'joinCodeEnabled',
  thumbnailUrl: 'thumbnailUrl',
  certificateEnabled: 'certificateEnabled',
  requireAllLessons: 'requireAllLessons',
  requireAllAssignments: 'requireAllAssignments',
  requireAllQuizzes: 'requireAllQuizzes',
  minPassingGrade: 'minPassingGrade',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseModuleScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  title: 'title',
  description: 'description',
  orderIndex: 'orderIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseLessonScalarFieldEnum = {
  id: 'id',
  moduleId: 'moduleId',
  title: 'title',
  description: 'description',
  duration: 'duration',
  orderIndex: 'orderIndex',
  content: 'content',
  videoUrl: 'videoUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseResourceScalarFieldEnum = {
  id: 'id',
  moduleId: 'moduleId',
  lessonId: 'lessonId',
  title: 'title',
  type: 'type',
  url: 'url',
  fileSize: 'fileSize',
  orderIndex: 'orderIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseEnrollmentScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  studentId: 'studentId',
  status: 'status',
  progressPercent: 'progressPercent',
  enrolledAt: 'enrolledAt',
  completedAt: 'completedAt',
  lastAccessedAt: 'lastAccessedAt',
  lastLessonId: 'lastLessonId'
};

exports.Prisma.LearningProgressScalarFieldEnum = {
  id: 'id',
  enrollmentId: 'enrollmentId',
  studentId: 'studentId',
  lessonId: 'lessonId',
  resourceId: 'resourceId',
  assignmentId: 'assignmentId',
  quizId: 'quizId',
  isCompleted: 'isCompleted',
  completedAt: 'completedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssignmentScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  moduleId: 'moduleId',
  trainerId: 'trainerId',
  title: 'title',
  description: 'description',
  dueDate: 'dueDate',
  maxMarks: 'maxMarks',
  allowedFileTypes: 'allowedFileTypes',
  maxFileSizeMb: 'maxFileSizeMb',
  submissionType: 'submissionType',
  status: 'status',
  orderIndex: 'orderIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssignmentSubmissionScalarFieldEnum = {
  id: 'id',
  assignmentId: 'assignmentId',
  studentId: 'studentId',
  status: 'status',
  textAnswer: 'textAnswer',
  fileUrl: 'fileUrl',
  fileName: 'fileName',
  fileSize: 'fileSize',
  submittedAt: 'submittedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssignmentGradeScalarFieldEnum = {
  id: 'id',
  submissionId: 'submissionId',
  trainerId: 'trainerId',
  marks: 'marks',
  feedback: 'feedback',
  status: 'status',
  gradedAt: 'gradedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuizScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  moduleId: 'moduleId',
  trainerId: 'trainerId',
  title: 'title',
  description: 'description',
  timeLimit: 'timeLimit',
  maxAttempts: 'maxAttempts',
  passingScore: 'passingScore',
  randomizeQuestions: 'randomizeQuestions',
  showResultsAfter: 'showResultsAfter',
  status: 'status',
  orderIndex: 'orderIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuizQuestionScalarFieldEnum = {
  id: 'id',
  quizId: 'quizId',
  type: 'type',
  question: 'question',
  marks: 'marks',
  explanation: 'explanation',
  orderIndex: 'orderIndex',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuizOptionScalarFieldEnum = {
  id: 'id',
  questionId: 'questionId',
  optionText: 'optionText',
  isCorrect: 'isCorrect',
  orderIndex: 'orderIndex'
};

exports.Prisma.QuizAttemptScalarFieldEnum = {
  id: 'id',
  quizId: 'quizId',
  studentId: 'studentId',
  attemptNumber: 'attemptNumber',
  startedAt: 'startedAt',
  submittedAt: 'submittedAt',
  timeTakenSeconds: 'timeTakenSeconds',
  totalMarks: 'totalMarks',
  obtainedMarks: 'obtainedMarks',
  percentage: 'percentage',
  passed: 'passed',
  status: 'status'
};

exports.Prisma.QuizAnswerScalarFieldEnum = {
  id: 'id',
  attemptId: 'attemptId',
  questionId: 'questionId',
  selectedOptionIds: 'selectedOptionIds',
  isCorrect: 'isCorrect',
  awardedMarks: 'awardedMarks'
};

exports.Prisma.CourseAnnouncementScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  moduleId: 'moduleId',
  authorId: 'authorId',
  trainerId: 'trainerId',
  title: 'title',
  content: 'content',
  isPinned: 'isPinned',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseDiscussionScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  moduleId: 'moduleId',
  authorId: 'authorId',
  studentId: 'studentId',
  title: 'title',
  content: 'content',
  isPinned: 'isPinned',
  isLocked: 'isLocked',
  helpfulCount: 'helpfulCount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DiscussionReplyScalarFieldEnum = {
  id: 'id',
  discussionId: 'discussionId',
  authorId: 'authorId',
  studentId: 'studentId',
  content: 'content',
  isHelpful: 'isHelpful',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseCompletionScalarFieldEnum = {
  id: 'id',
  enrollmentId: 'enrollmentId',
  courseId: 'courseId',
  studentId: 'studentId',
  completionPercentage: 'completionPercentage',
  finalScore: 'finalScore',
  lessonsCompleted: 'lessonsCompleted',
  assignmentsCompleted: 'assignmentsCompleted',
  quizzesPassed: 'quizzesPassed',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.CertificateScalarFieldEnum = {
  id: 'id',
  certificateId: 'certificateId',
  verificationToken: 'verificationToken',
  enrollmentId: 'enrollmentId',
  courseId: 'courseId',
  studentId: 'studentId',
  trainerId: 'trainerId',
  documentId: 'documentId',
  studentName: 'studentName',
  courseTitle: 'courseTitle',
  instructorName: 'instructorName',
  institutionName: 'institutionName',
  issueDate: 'issueDate',
  status: 'status',
  revokedAt: 'revokedAt',
  revokedReason: 'revokedReason',
  qrCodeDataUrl: 'qrCodeDataUrl',
  pdfUrl: 'pdfUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CourseKnowledgeChunkScalarFieldEnum = {
  id: 'id',
  courseId: 'courseId',
  moduleId: 'moduleId',
  lessonId: 'lessonId',
  chunkIndex: 'chunkIndex',
  title: 'title',
  content: 'content',
  sourceType: 'sourceType',
  sourceName: 'sourceName',
  tokenCount: 'tokenCount',
  keywords: 'keywords',
  createdAt: 'createdAt'
};

exports.Prisma.AIConversationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  studentId: 'studentId',
  courseId: 'courseId',
  moduleId: 'moduleId',
  lessonId: 'lessonId',
  title: 'title',
  summary: 'summary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIMessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  sender: 'sender',
  content: 'content',
  sources: 'sources',
  tokensUsed: 'tokensUsed',
  createdAt: 'createdAt'
};

exports.Prisma.StudyPlanScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  courseId: 'courseId',
  title: 'title',
  targetExamDate: 'targetExamDate',
  dailyHours: 'dailyHours',
  weeklySchedule: 'weeklySchedule',
  status: 'status',
  generatedByAi: 'generatedByAi',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LearningInsightScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  courseId: 'courseId',
  strongTopics: 'strongTopics',
  weakTopics: 'weakTopics',
  recommendedActions: 'recommendedActions',
  lastCalculatedAt: 'lastCalculatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AIUsageScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  studentId: 'studentId',
  feature: 'feature',
  tokensUsed: 'tokensUsed',
  createdAt: 'createdAt'
};

exports.Prisma.SkillProfileScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  skillName: 'skillName',
  category: 'category',
  proficiencyPercent: 'proficiencyPercent',
  level: 'level',
  verifiedStatus: 'verifiedStatus',
  lastEvaluatedAt: 'lastEvaluatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SkillEvidenceScalarFieldEnum = {
  id: 'id',
  skillProfileId: 'skillProfileId',
  studentId: 'studentId',
  sourceType: 'sourceType',
  sourceId: 'sourceId',
  evidenceText: 'evidenceText',
  confidenceScore: 'confidenceScore',
  verificationType: 'verificationType',
  trainerId: 'trainerId',
  createdAt: 'createdAt'
};

exports.Prisma.PlacementReadinessScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  overallScore: 'overallScore',
  learningScore: 'learningScore',
  skillsScore: 'skillsScore',
  certificationsScore: 'certificationsScore',
  experienceScore: 'experienceScore',
  profileScore: 'profileScore',
  readinessTier: 'readinessTier',
  skillGaps: 'skillGaps',
  recommendedActionItems: 'recommendedActionItems',
  lastCalculatedAt: 'lastCalculatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentRiskAssessmentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  riskLevel: 'riskLevel',
  signals: 'signals',
  suggestedActions: 'suggestedActions',
  lastActiveDate: 'lastActiveDate',
  missedAssignmentsCount: 'missedAssignmentsCount',
  failedQuizzesCount: 'failedQuizzesCount',
  averageScore: 'averageScore',
  lastEvaluatedAt: 'lastEvaluatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Student: 'Student',
  Company: 'Company',
  Resume: 'Resume',
  JobPosting: 'JobPosting',
  Application: 'Application',
  SkillAssessment: 'SkillAssessment',
  SkillGapAnalysis: 'SkillGapAnalysis',
  CodingSession: 'CodingSession',
  Institution: 'Institution',
  User: 'User',
  Trainer: 'Trainer',
  Cohort: 'Cohort',
  AuditLog: 'AuditLog',
  Resource: 'Resource',
  ResourceBooking: 'ResourceBooking',
  ResourceRequest: 'ResourceRequest',
  SharingAgreement: 'SharingAgreement',
  ResourceSharingNotification: 'ResourceSharingNotification',
  TrainerSession: 'TrainerSession',
  Internship: 'Internship',
  InternshipApplication: 'InternshipApplication',
  Certification: 'Certification',
  PlacementDrive: 'PlacementDrive',
  PlacementRound: 'PlacementRound',
  PlacementApplication: 'PlacementApplication',
  Document: 'Document',
  DocumentRequest: 'DocumentRequest',
  DocumentProcessing: 'DocumentProcessing',
  OCRResult: 'OCRResult',
  ExtractedField: 'ExtractedField',
  DocumentVerification: 'DocumentVerification',
  QRCodeResult: 'QRCodeResult',
  DuplicateMatch: 'DuplicateMatch',
  VerificationHistory: 'VerificationHistory',
  YOLODetection: 'YOLODetection',
  FaceVerification: 'FaceVerification',
  TamperAnalysis: 'TamperAnalysis',
  TamperSignal: 'TamperSignal',
  AIAnalysis: 'AIAnalysis',
  AIAnalysisEvidence: 'AIAnalysisEvidence',
  VerificationStage: 'VerificationStage',
  DocumentActivity: 'DocumentActivity',
  DocumentShare: 'DocumentShare',
  TrustedDevice: 'TrustedDevice',
  LoginOtp: 'LoginOtp',
  LoginAudit: 'LoginAudit',
  CourseCategory: 'CourseCategory',
  Course: 'Course',
  CourseModule: 'CourseModule',
  CourseLesson: 'CourseLesson',
  CourseResource: 'CourseResource',
  CourseEnrollment: 'CourseEnrollment',
  LearningProgress: 'LearningProgress',
  Assignment: 'Assignment',
  AssignmentSubmission: 'AssignmentSubmission',
  AssignmentGrade: 'AssignmentGrade',
  Quiz: 'Quiz',
  QuizQuestion: 'QuizQuestion',
  QuizOption: 'QuizOption',
  QuizAttempt: 'QuizAttempt',
  QuizAnswer: 'QuizAnswer',
  CourseAnnouncement: 'CourseAnnouncement',
  CourseDiscussion: 'CourseDiscussion',
  DiscussionReply: 'DiscussionReply',
  CourseCompletion: 'CourseCompletion',
  Certificate: 'Certificate',
  CourseKnowledgeChunk: 'CourseKnowledgeChunk',
  AIConversation: 'AIConversation',
  AIMessage: 'AIMessage',
  StudyPlan: 'StudyPlan',
  LearningInsight: 'LearningInsight',
  AIUsage: 'AIUsage',
  SkillProfile: 'SkillProfile',
  SkillEvidence: 'SkillEvidence',
  PlacementReadiness: 'PlacementReadiness',
  StudentRiskAssessment: 'StudentRiskAssessment'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
