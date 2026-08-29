import axios from 'axios'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-oss-120b'

export const BLOCKED_SCOPE_MESSAGE =
  "This request is outside PlaceIQ's learning scope. Ask me about your studies, skills, languages, career preparation, or personal development."

export const JOBS_BLOCKED_SCOPE_MESSAGE =
  "This search is outside PlaceIQ's career and learning scope. Try searching for jobs, internships, placements, skills, or career preparation."

export type LearningCategory =
  | 'Academic'
  | 'Technical Skills'
  | 'Languages'
  | 'Career'
  | 'Soft Skills'
  | 'Personal Development'
  | 'Research'
  | 'General Educational'
  | 'Jobs'
  | 'Internships'
  | 'Placements'
  | 'Professional Development'

export interface ScopeGuardResult {
  allowed: boolean
  category?: LearningCategory
  reason?: string
  blockedMessage?: string
}

// -------------------------------------------------------------
// 1. Semantic Lexical Dictionaries & Intent Patterns
// -------------------------------------------------------------

const ALLOWED_KEYWORDS: Record<LearningCategory, string[]> = {
  'Jobs': [
    'job', 'jobs', 'fresher jobs', 'software developer jobs', 'software developer', 'web developer', 'backend developer',
    'frontend developer', 'fullstack developer', 'data engineer', 'cloud engineer', 'devops engineer', 'software engineer',
    'cybersecurity engineer', 'qa engineer', 'sde', 'sde-1', 'sde-2', 'hiring', 'vacancy', 'openings', 'fresher openings',
    'entry level', 'analyst', 'developer', 'consultant', 'graduate trainee', 'off campus drive', 'junior developer',
    'fresher', 'freshers', 'java fresher jobs', 'python fresher jobs', 'fresher developer'
  ],
  'Internships': [
    'intern', 'interns', 'internship', 'internships', 'summer internship', 'winter internship', 'virtual internship',
    'research internship', 'python internship', 'python internships', 'web development internship', 'data science internship',
    'frontend internship', 'backend internship', 'software intern', 'developer intern', 'engineering intern', 'stipend',
    'trainee', 'apprentice', 'internships for students', 'internships for computer engineering students'
  ],
  'Placements': [
    'placement', 'placements', 'campus placement', 'placement drive', 'recruitment drive', 'placement opportunities',
    'placement preparation', 'on campus', 'off campus', 'mass recruitment', 'aptitude test', 'technical assessment',
    'interview preparation for placements', 'cybersecurity placement opportunities', 'software engineering placement',
    'campus recruitment', 'hiring drive'
  ],
  'Professional Development': [
    'professional development', 'resume skills', 'resume skills for software developer', 'skills required',
    'skills required for java developer', 'skills required for', 'career preparation', 'portfolio building',
    'industry ready', 'technical skills for', 'upskilling'
  ],
  'Academic': [
    'math', 'mathematics', 'calculus', 'algebra', 'linear algebra', 'geometry', 'statistics', 'probability',
    'physics', 'quantum', 'thermodynamics', 'optics', 'mechanics', 'electromagnetism',
    'chemistry', 'organic chemistry', 'inorganic', 'physical chemistry', 'biochemistry',
    'biology', 'genetics', 'microbiology', 'botany', 'zoology', 'anatomy', 'physiology',
    'computer science', 'engineering', 'electrical', 'mechanical', 'civil', 'electronics', 'vlsi',
    'signals', 'discrete math', 'finite automata', 'compiler', 'operating system', 'dbms',
    'academic', 'notes', 'assignment', 'assignments', 'exam', 'exams', 'pyq', 'previous year',
    'syllabus', 'course', 'curriculum', 'question paper', 'formula', 'derivation', 'proof',
    'theorem', 'textbook', 'lecture', 'revision', 'practice question', 'numericals',
    'inheritance', 'polymorphism', 'encapsulation', 'abstraction', 'oop', 'object oriented'
  ],
  'Technical Skills': [
    'c', 'c++', 'cpp', 'c#', 'java', 'python', 'javascript', 'typescript', 'rust', 'go', 'golang',
    'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala', 'r', 'matlab', 'sql', 'nosql',
    'web development', 'frontend', 'backend', 'fullstack', 'html', 'css', 'react', 'next.js', 'nextjs',
    'vue', 'angular', 'svelte', 'tailwind', 'bootstrap', 'node.js', 'nodejs', 'express', 'django', 'flask',
    'fastapi', 'spring boot', 'laravel', 'asp.net', 'graphql', 'rest api', 'websocket',
    'ai', 'artificial intelligence', 'ml', 'machine learning', 'deep learning', 'nlp', 'computer vision',
    'neural network', 'data science', 'data analytics', 'data engineering', 'pandas', 'numpy', 'scikit-learn',
    'tensorflow', 'pytorch', 'keras', 'tableau', 'power bi', 'big data', 'hadoop', 'spark',
    'cybersecurity', 'ethical hacking', 'penetration testing', 'cryptography', 'network security', 'soc',
    'cloud', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'ci/cd', 'terraform', 'ansible',
    'linux', 'unix', 'bash', 'shell scripting', 'networking', 'tcp/ip', 'dns', 'osi model', 'routing',
    'database', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'prisma', 'orm',
    'software engineering', 'data structures', 'algorithms', 'dsa', 'leetcode', 'recursion', 'dynamic programming',
    'graph', 'tree', 'linked list', 'sorting', 'system design', 'microservices', 'git', 'github', 'opengl',
    'shader', 'embedded systems', 'iot', 'robotics', 'cad', 'autocad', 'matlab', 'simulation', 'mcq', 'mcqs'
  ],
  'Languages': [
    'english', 'hindi', 'marathi', 'spanish', 'french', 'german', 'japanese', 'chinese', 'mandarin',
    'tamil', 'telugu', 'bengali', 'kannada', 'gujarati', 'malayalam', 'punjabi', 'sanskrit',
    'grammar', 'vocabulary', 'vocab', 'speaking', 'reading', 'writing', 'pronunciation', 'accent',
    'spoken english', 'teach me english', 'learn english', 'ielts', 'toefl', 'gre verbal', 'comprehension', 'tenses', 'prepositions',
    'fluency', 'conversation', 'phrases', 'idioms', 'synonyms', 'antonyms', 'phonetics', 'language learning'
  ],
  'Career': [
    'interview', 'interviews', 'mock interview', 'interview preparation', 'prepare for an interview', 'hr round', 'technical interview',
    'resume', 'cv', 'ats resume', 'cover letter', 'linkedin profile', 'portfolio',
    'aptitude', 'quantitative aptitude', 'logical reasoning', 'verbal ability', 'group discussion', 'gd',
    'placement', 'placements', 'placement interview', 'campus placement', 'placement drive', 'internship', 'internships',
    'career', 'career path', 'career guidance', 'job preparation', 'salary negotiation', 'coding test',
    'technical assessment', 'system design interview', 'behavioral interview', 'star method',
    'tell me about yourself', 'strengths and weaknesses', 'self introduction', 'company research'
  ],
  'Soft Skills': [
    'leadership', 'teamwork', 'communication', 'improve communication', 'improve my communication', 'presentation', 'presentation skills', 'public speaking',
    'time management', 'problem solving', 'critical thinking', 'decision making', 'negotiation',
    'conflict resolution', 'emotional intelligence', 'active listening', 'adaptability', 'work ethic',
    'professionalism', 'etiquette', 'body language', 'interpersonal skills', 'assertiveness'
  ],
  'Personal Development': [
    'motivation', 'study motivation', 'career motivation', 'confidence', 'self confidence', 'improve my confidence', 'improve confidence',
    'demotivated', 'failed exam', 'failed my exam', 'back to studying', 'exam anxiety', 'fear of failure',
    'productivity', 'discipline', 'goal setting', 'study habits', 'learning techniques', 'feynman technique', 'pomodoro',
    'active recall', 'spaced repetition', 'mindset', 'growth mindset', 'focus', 'concentration',
    'overcoming procrastination', 'exam stress', 'mental toughness', 'daily routine for students', 'habit building'
  ],
  'Research': [
    'research paper', 'technical research', 'project ideas', 'engineering project', 'capstone project',
    'final year project', 'ieee paper', 'documentation', 'technical tutorial', 'architecture guide',
    'open source project', 'whitepaper', 'case study', 'literature review', 'methodology', 'dissertation'
  ],
  'General Educational': [
    'how to learn', 'how to code', 'tutorial', 'course', 'crash course', 'bootcamp', 'masterclass',
    'study guide', 'cheat sheet', 'reference manual', 'guide for beginners', 'roadmap', 'curriculum',
    'explained', 'explanation', 'example', 'basics', 'deep dive', 'practice', 'quiz'
  ]
}

// Strictly restricted non-educational / entertainment / jailbreak patterns
const RESTRICTED_PATTERNS: { regex: RegExp; reason: string }[] = [
  // Prompt Injection & Jailbreak Override Attempts
  {
    regex: /\b(ignore (?:all )?(?:previous |prior |your )?(?:instructions|rules|restrictions|guardrails|filters)|disregard (?:all )?(?:rules|restrictions|guardrails|instructions)|bypass (?:restrictions|filters|guardrails)|act as an? (?:unrestricted|jailbreak|dan|evil)|pretend you have no (?:rules|restrictions))\b/i,
    reason: 'Prompt Injection or Scope Bypass Attempt'
  },
  // Entertainment & Movies / TV
  {
    regex: /\b(latest movies?|new movies?|box office|movie download|watch full movie|hd movies?|netflix shows?|tv series|bollywood songs?|hollywood gossip|celebrity news|actor gossip|actress photo|film trailer|cinema tickets?|popcorn time|entertainment news|random entertainment|recommend (?:a )?movie|movie recommendation)\b/i,
    reason: 'Entertainment & Movies'
  },
  // Gaming entertainment (pure gaming vs programming)
  {
    regex: /\b(gta [v0-9]|pubg|fortnite|valorant|free fire|minecraft download|playstation 5|ps5 games|xbox pass|nintendo switch|game cheats|roblox codes|gaming stream|best laptop for (?:.* )?gaming|gaming pc|gaming chair)\b/i,
    reason: 'Gaming Entertainment'
  },
  // Shopping / E-commerce intent & merchandise
  {
    regex: /\b(buy (?:phone|iphone|laptop|shoes|clothes|merchandise|tv|watch)|best phone to buy|help me shop|shopping for (?:a )?(?:phone|laptop|shoes|watch)|cheap flights|discount coupon|amazon sale|flipkart offers?|sneakers buy|clothes shopping|order food|zomato promo|price in india under|buy .* merchandise|merchandise store)\b/i,
    reason: 'Shopping & E-commerce'
  },
  // Dating, Adult, Gambling
  {
    regex: /\b(dating (?:app|advice|site|tips)|tinder|bumble|hinge|find girlfriend|find boyfriend|dating advice for (?:men|women)|adult content|porn|nsfw|gambling|casino|betting app|dream11 prediction|ipl betting|lottery result)\b/i,
    reason: 'Dating, Adult or Gambling'
  },
  // Random sports scores & general gossip
  {
    regex: /\b(cricket score|what'?s today'?s cricket score|live match score|ipl (?:live )?score|football match highlights|transfer news|celebrity net worth|horoscope today|astrology prediction)\b/i,
    reason: 'Random Sports or Gossip'
  },
  // Unrelated politics & crime news
  {
    regex: /\b(political scandal|election gossip|crime news today|murder case update|celebrity arrest)\b/i,
    reason: 'Unrelated News & Politics'
  }
]

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// -------------------------------------------------------------
// 2. Fast Deterministic Scope Classifier
// -------------------------------------------------------------

export function evaluateScopeDeterministically(
  rawQuery: string,
  options?: { mode?: 'learning' | 'jobs' }
): ScopeGuardResult {
  const defaultBlockedMsg = options?.mode === 'jobs' ? JOBS_BLOCKED_SCOPE_MESSAGE : BLOCKED_SCOPE_MESSAGE
  const query = rawQuery.trim().toLowerCase()
  if (!query) {
    return {
      allowed: false,
      blockedMessage: defaultBlockedMsg,
      reason: 'Empty query'
    }
  }

  // 1. Check explicit restricted patterns first
  for (const { regex, reason } of RESTRICTED_PATTERNS) {
    if (regex.test(query)) {
      // Disambiguation check: e.g. "game development in C++" or "machine learning for cricket analytics"
      const hasEducationalModifier =
        /\b(programming|development|tutorial|algorithm|course|code|implementation|architecture|learn|study|lecture|concept|jobs?|internships?|placement|role|engineer|developer)\b/i.test(
          query
        )

      if (!hasEducationalModifier) {
        return {
          allowed: false,
          blockedMessage: defaultBlockedMsg,
          reason
        }
      }
    }
  }

  // 2. Check Allowed Categories
  for (const [category, keywords] of Object.entries(ALLOWED_KEYWORDS)) {
    for (const kw of keywords) {
      const escaped = escapeRegExp(kw)
      // Word boundary match for short keywords, word boundary or substring for multi-word
      const pattern = kw.length <= 3 ? new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}($|\\s|[^a-zA-Z0-9])`, 'i') : new RegExp(`(^|\\s|[^a-zA-Z0-9])${escaped}`, 'i')
      if (pattern.test(query)) {
        return {
          allowed: true,
          category: category as LearningCategory,
          reason: `Matched educational domain: ${category}`
        }
      }
    }
  }

  // 3. Check General Educational & Conversational Intent Phrases
  const educationalIntents: { regex: RegExp; category: LearningCategory }[] = [
    { regex: /how to (learn|build|implement|code|create|solve|write|understand|prepare|calculate|derive|prove)/i, category: 'General Educational' },
    { regex: /what is (the |a )?[a-z0-9_\-\s]+(in|for|algorithm|data structure|framework|language|concept|math|physics|chemistry)?/i, category: 'General Educational' },
    { regex: /difference between/i, category: 'General Educational' },
    { regex: /guide (to|for)/i, category: 'General Educational' },
    { regex: /best practices (for|in)/i, category: 'General Educational' },
    { regex: /overview of/i, category: 'General Educational' },
    { regex: /introduction to/i, category: 'General Educational' },
    { regex: /summary of/i, category: 'General Educational' },
    { regex: /principles of/i, category: 'General Educational' },
    { regex: /fundamentals of/i, category: 'General Educational' },
    { regex: /step by step/i, category: 'General Educational' },
    { regex: /project ideas/i, category: 'Research' },
    { regex: /explain (inheritance|polymorphism|recursion|pointers|trees|graphs|algorithms?|code|concept|math|calculus)/i, category: 'Technical Skills' },
    { regex: /teach (me )?(english|math|programming|coding|python|java|c\+\+|javascript|hindi|marathi|french|german)/i, category: 'Languages' },
    { regex: /give me [a-z0-9\s]+ (mcqs?|questions?|practice|problems?|test|quiz)/i, category: 'Technical Skills' },
    { regex: /help me (prepare for an? interview|prepare for placement|improve my communication|study|learn|solve)/i, category: 'Career' },
    { regex: /i (am|feel|was) demotivated (because of|due to|for)? (exams?|studies|placements?|interviews?)?/i, category: 'Personal Development' },
    { regex: /i failed (my )?(exam|test|interview) and feel demotivated/i, category: 'Personal Development' },
    { regex: /how (can|do) i get back to studying/i, category: 'Personal Development' },
    { regex: /how (can|do) i improve (my )?confidence/i, category: 'Personal Development' },
    { regex: /how (can|do) i improve (my )?communication/i, category: 'Soft Skills' },
    { regex: /internships? for [a-z0-9\s]+(students?|freshers?|engineers?)/i, category: 'Internships' },
    { regex: /skills required for [a-z0-9\s]+/i, category: 'Professional Development' },
    { regex: /resume skills for [a-z0-9\s]+/i, category: 'Professional Development' },
    { regex: /[a-z0-9\s]+ (placement opportunities?|recruitment drives?|campus drives?)/i, category: 'Placements' },
    { regex: /[a-z0-9\s]+ (fresher jobs?|entry level jobs?|developer jobs?|internships?)/i, category: 'Jobs' },
    { regex: /interview preparation for (placements?|interviews?|jobs?)/i, category: 'Placements' }
  ]

  for (const { regex, category } of educationalIntents) {
    if (regex.test(query)) {
      return {
        allowed: true,
        category,
        reason: `Educational/Career intent detected: ${category}`
      }
    }
  }

  // 4. If query is a single common English word that is clearly non-educational (e.g. "gaming", "movies", "shoes", "cars")
  const commonEntertainmentNouns = [
    'movies', 'movie', 'cinema', 'songs', 'song', 'gaming', 'games', 'game', 'shoes', 'clothes',
    'cars', 'car', 'bikes', 'bike', 'cricket', 'football', 'gossip', 'news', 'horoscope', 'memes', 'meme'
  ]
  if (commonEntertainmentNouns.includes(query)) {
    return {
      allowed: false,
      blockedMessage: defaultBlockedMsg,
      reason: 'General entertainment noun'
    }
  }

  // Fallback for short technical acronyms/terms (e.g. "API", "RAG", "LLM", "DOM", "CSS", "OOP", "SOLID", "K8s", "CI")
  if (/^[a-z0-9+#.\-]{1,12}$/i.test(query)) {
    const techAcronyms = [
      'api', 'rag', 'llm', 'dom', 'css', 'oop', 'solid', 'k8s', 'ci', 'cd', 'os', 'dbms', 'sql', 'nosql',
      'gui', 'cli', 'jvm', 'jre', 'jdk', 'npm', 'pip', 'sdk', 'ide', 'cors', 'jwt', 'mvc', 'mvvm', 'dry',
      'kiss', 'yagni', 'pr', 'mr', 'vcs', 'ddos', 'xss', 'csrf', 'tls', 'ssl', 'ssh', 'ftp', 'http', 'https',
      'ip', 'tcp', 'udp', 'cpu', 'gpu', 'ram', 'rom', 'ai', 'ml', 'nlp', 'cv', 'ocr', 'pyq', 'gate', 'cat', 'gre',
      'sde', 'qa', 'devops', 'dba', 'hr', 'ats', 'ui', 'ux'
    ]
    if (techAcronyms.includes(query)) {
      return {
        allowed: true,
        category: 'Technical Skills',
        reason: 'Technical acronym / concept'
      }
    }
  }

  // If query does not match any educational domain or intent:
  return {
    allowed: false,
    blockedMessage: defaultBlockedMsg,
    reason: 'Query does not match any recognized educational, technical, career, or academic learning scope.'
  }
}

// -------------------------------------------------------------
// 3. AI-Assisted Semantic Scope Validation (with Groq LLM)
// -------------------------------------------------------------

async function evaluateScopeWithAI(rawQuery: string): Promise<ScopeGuardResult | null> {
  if (!GROQ_API_KEY) return null

  try {
    const prompt = `You are the PlaceIQ Learning Hub Scope Guard. PlaceIQ is a strict educational, career preparation, and technical skills learning platform.

Evaluate whether the user query is intended for learning in one of these ALLOWED domains:
1. Academic (Math, Physics, Chemistry, CS, Engineering, Biology, Exam prep, PYQs, Notes)
2. Technical Skills (Programming, Web Dev, AI/ML, Cloud, DevOps, Security, Databases, DSA)
3. Language Learning (English, Hindi, Marathi, Foreign languages, Grammar, Vocab, Communication)
4. Career Learning (Interview prep, Resume building, Aptitude, Placement preparation, Professional skills)
5. Soft Skills (Leadership, Teamwork, Time management, Problem solving, Public speaking)
6. Personal Development (Study motivation, Productivity, Discipline, Study habits, Learning techniques)
7. Research & Projects (Technical research, Project ideas, Engineering projects, Documentation)

RESTRICTED domains:
- Entertainment (Movies, TV, Celebrity gossip, Music, Film downloads)
- Gaming entertainment (General video gaming, game cheats, streaming)
- Shopping / E-commerce (Buying gadgets, phones, clothes, food delivery)
- Dating / Adult / Gambling / Sports live scores / Unrelated politics

User Query: "${rawQuery}"

Respond ONLY with a valid JSON object in this exact format:
{
  "allowed": true | false,
  "category": "Academic" | "Technical Skills" | "Languages" | "Career" | "Soft Skills" | "Personal Development" | "Research" | "General Educational" | "Restricted",
  "reason": "Short 1-sentence rationale"
}`

    const res = await axios.post(
      GROQ_API_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a precise classifier for educational learning scope. Output pure JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 4000
      }
    )

    const content = res.data?.choices?.[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)
    if (typeof parsed.allowed === 'boolean') {
      return {
        allowed: parsed.allowed,
        category: parsed.allowed ? (parsed.category as LearningCategory) || 'General Educational' : undefined,
        reason: parsed.reason,
        blockedMessage: parsed.allowed ? undefined : BLOCKED_SCOPE_MESSAGE
      }
    }
    return null
  } catch (err: any) {
    // LLM call failed or timed out; silent fallback to deterministic engine
    return null
  }
}

// -------------------------------------------------------------
// 4. Centralized LearningScopeGuard Main Validator
// -------------------------------------------------------------

export async function validateLearningScope(
  query: string,
  options?: { mode?: 'learning' | 'jobs' }
): Promise<ScopeGuardResult> {
  const defaultBlockedMsg = options?.mode === 'jobs' ? JOBS_BLOCKED_SCOPE_MESSAGE : BLOCKED_SCOPE_MESSAGE
  const cleanQuery = (query || '').trim()
  if (!cleanQuery) {
    return {
      allowed: false,
      blockedMessage: defaultBlockedMsg,
      reason: 'Empty query'
    }
  }

  // Step 1: Run fast deterministic evaluation
  const deterministicResult = evaluateScopeDeterministically(cleanQuery, options)

  // If clearly allowed with high confidence, return immediately for instant response
  if (deterministicResult.allowed) {
    return deterministicResult
  }

  // If ambiguous or blocked by deterministic rules, try AI semantic validation if available
  // to avoid false positives on nuanced queries (e.g. "How does Netflix stream video at scale?" which is distributed systems system design)
  if (GROQ_API_KEY) {
    const aiResult = await evaluateScopeWithAI(cleanQuery)
    if (aiResult !== null) {
      return {
        ...aiResult,
        blockedMessage: aiResult.allowed ? undefined : defaultBlockedMsg
      }
    }
  }

  // Fall back to deterministic outcome
  return deterministicResult
}

// -------------------------------------------------------------
// 5. External Search Results Sanitizer (Serper / External Content)
// -------------------------------------------------------------

export function filterLearningSearchResults(resources: {
  videos?: any[]
  documentation?: any[]
  communities?: any[]
}) {
  const disallowedResultPatterns = [
    /\b(buy now|price in india|discount|shopping cart|free download movie|torrent|stream online free|watch (?:free )?movies?|free movies?|movies? online|movie stream|box office|merchandise|t-shirts?|game review|casino|betting|dream11|dating app|tinder)\b/i
  ]

  const isSafeItem = (item: any) => {
    if (!item) return false
    const textToCheck = `${item.title || ''} ${item.snippet || ''} ${item.link || ''}`
    return !disallowedResultPatterns.some(pat => pat.test(textToCheck))
  }

  const safeVideos = (resources.videos || []).filter(isSafeItem)
  const safeDocs = (resources.documentation || []).filter(isSafeItem)
  const safeCommunities = (resources.communities || []).filter(isSafeItem)

  return {
    videos: safeVideos,
    documentation: safeDocs,
    communities: safeCommunities
  }
}

// -------------------------------------------------------------
// 6. AI Output Safety & Anti-Jailbreak Validator
// -------------------------------------------------------------

export function validateAiResponse(aiResponse: string): { isSafe: boolean; sanitizedResponse: string } {
  if (!aiResponse || !aiResponse.trim()) {
    return { isSafe: true, sanitizedResponse: '' }
  }

  const disallowedOutputPatterns = [
    /\b(online casino|gambling site|bet on dream11|download free movie torrent|watch leaked movie|tinder dating (?:app|site)|buy this phone now at discount)\b/i
  ]

  for (const pat of disallowedOutputPatterns) {
    if (pat.test(aiResponse)) {
      return {
        isSafe: false,
        sanitizedResponse: BLOCKED_SCOPE_MESSAGE
      }
    }
  }

  return {
    isSafe: true,
    sanitizedResponse: aiResponse
  }
}
