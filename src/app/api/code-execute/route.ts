import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import axios from 'axios'

// Judge0 Language IDs
const JUDGE0_LANGUAGE_MAP: Record<string, number> = {
  cpp: 54,        // C++ (GCC 9.2.0)
  'c++': 54,
  c: 50,          // C (GCC 9.2.0)
  python: 71,     // Python (3.8.1)
  python3: 71,
  py: 71,
  java: 62,       // Java (OpenJDK 13.0.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  js: 63,
  typescript: 74, // TypeScript (3.7.4)
  ts: 74,
  go: 60,         // Go (1.13.5)
  golang: 60,
  rust: 73,       // Rust (1.40.0)
  rs: 73
}

// Wandbox Compiler Names
const WANDBOX_COMPILER_MAP: Record<string, string> = {
  cpp: 'gcc-head',
  'c++': 'gcc-head',
  c: 'gcc-head-c',
  python: 'cpython-head',
  python3: 'cpython-head',
  py: 'cpython-head'
}

interface ExecutionResult {
  output: string
  error?: string
  status?: string
  executionTime?: string
  memory?: string
  source: 'judge0' | 'wandbox' | 'local' | 'groq'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, language, input = '' } = body

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Source code is required' }, { status: 400 })
    }

    const langKey = (language || 'cpp').toLowerCase().trim()
    console.log(`[Code Execution] Processing request for language: "${langKey}"`)

    let result: ExecutionResult | null = null

    // ── TIER 1: Judge0 CE Cloud Sandbox Engine ──
    const judge0Id = JUDGE0_LANGUAGE_MAP[langKey]
    if (judge0Id) {
      try {
        console.log(`[Code Execution] Attempting Tier 1: Judge0 CE (id: ${judge0Id})...`)
        const response = await axios.post(
          'https://ce.judge0.com/submissions?base64_encoded=false&wait=true',
          {
            source_code: code,
            language_id: judge0Id,
            stdin: input || ''
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 12000
          }
        )

        const data = response.data
        if (data) {
          const compileOutput = data.compile_output || ''
          const stdout = data.stdout || ''
          const stderr = data.stderr || ''
          const message = data.message || ''
          const statusDesc = data.status?.description || ''
          const time = data.time ? `${data.time}s` : undefined
          const memory = data.memory ? `${Math.round(data.memory)} KB` : undefined

          let formattedOutput = ''
          let hasError = false

          if (compileOutput) {
            formattedOutput = compileOutput
            hasError = true
          } else if (stderr) {
            formattedOutput = stdout ? `${stdout}\n--- Errors ---\n${stderr}` : stderr
            hasError = true
          } else if (stdout) {
            formattedOutput = stdout
          } else if (message) {
            formattedOutput = message
            hasError = true
          } else {
            formattedOutput = statusDesc ? `[Status: ${statusDesc}] Execution completed with no output.` : 'Program executed successfully with no output.'
          }

          result = {
            output: formattedOutput.trimEnd(),
            error: hasError ? (compileOutput || stderr || message || statusDesc) : '',
            status: statusDesc || (hasError ? 'Error' : 'Success'),
            executionTime: time,
            memory: memory,
            source: 'judge0'
          }
          console.log(`[Code Execution] Tier 1 Judge0 succeeded. Status: ${statusDesc}`)
        }
      } catch (err: any) {
        console.warn(`[Code Execution] Tier 1 Judge0 failed or timed out: ${err.message}`)
      }
    }

    // ── TIER 2: Wandbox (C/C++) or Local Node/Python Runtime ──
    if (!result || (result.error && result.error.includes('whitelist'))) {
      // 2A. Wandbox for C/C++
      const wandboxCompiler = WANDBOX_COMPILER_MAP[langKey]
      if (wandboxCompiler) {
        try {
          console.log(`[Code Execution] Attempting Tier 2A: Wandbox (${wandboxCompiler})...`)
          const wbRes = await axios.post(
            'https://wandbox.org/api/compile.json',
            {
              compiler: wandboxCompiler,
              code: code,
              stdin: input || ''
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 10000
            }
          )

          const wbData = wbRes.data
          if (wbData) {
            const out = wbData.program_output || ''
            const err = wbData.compiler_error || wbData.program_error || wbData.compiler_message || ''
            const isError = !out && !!err

            result = {
              output: (out || err || 'Program executed with no output.').trimEnd(),
              error: isError ? err : '',
              status: wbData.status === '0' ? 'Success' : 'Compilation Error',
              source: 'wandbox'
            }
            console.log('[Code Execution] Tier 2A Wandbox succeeded')
          }
        } catch (wbErr: any) {
          console.warn(`[Code Execution] Tier 2A Wandbox failed: ${wbErr.message}`)
        }
      }

      // 2B. Local Process for Python / JS
      if (!result && (langKey === 'python' || langKey === 'python3' || langKey === 'py' || langKey === 'javascript' || langKey === 'js')) {
        try {
          console.log(`[Code Execution] Attempting Tier 2B: Local execution for ${langKey}...`)
          const localRes = await executeLocally(code, langKey, input)
          result = {
            output: localRes.output,
            error: localRes.error,
            status: localRes.error ? 'Runtime Error' : 'Success',
            source: 'local'
          }
          console.log('[Code Execution] Tier 2B Local execution succeeded')
        } catch (localErr: any) {
          console.warn(`[Code Execution] Tier 2B Local execution failed: ${localErr.message}`)
        }
      }
    }

    // ── TIER 3: Groq AI Deterministic Code Interpreter Engine ──
    if (!result) {
      console.log('[Code Execution] Attempting Tier 3: Groq AI Code Execution Engine...')
      try {
        const groqRes = await executeWithGroq(code, langKey, input)
        result = {
          output: groqRes.output,
          error: groqRes.error,
          status: groqRes.status || (groqRes.error ? 'Error' : 'Success'),
          executionTime: groqRes.executionTime || '0.05s',
          source: 'groq'
        }
        console.log('[Code Execution] Tier 3 Groq Engine succeeded')
      } catch (groqErr: any) {
        console.error('[Code Execution] Tier 3 Groq failed:', groqErr.message)
      }
    }

    if (!result) {
      return NextResponse.json(
        {
          output: 'Code execution could not be completed. Please check your syntax or try again.',
          error: 'Execution service currently unavailable.',
          status: 'Error'
        },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Code Execution API Error]:', error)
    return NextResponse.json(
      {
        output: `Execution error: ${error.message || 'Unknown error occurred'}`,
        error: error.message || 'Execution failed',
        status: 'Error'
      },
      { status: 500 }
    )
  }
}

// Local Execution Helper using safe child_process.spawn with stdin streaming
async function executeLocally(code: string, language: string, input: string): Promise<{ output: string; error: string }> {
  return new Promise((resolve, reject) => {
    let command = ''
    let args: string[] = []

    if (language === 'javascript' || language === 'js') {
      command = 'node'
      args = ['-e', code]
    } else if (language === 'python' || language === 'python3' || language === 'py') {
      command = process.platform === 'win32' ? 'python' : 'python3'
      args = ['-c', code]
    } else {
      return reject(new Error(`Local execution not supported for ${language}`))
    }

    const proc = spawn(command, args, { timeout: 6000 })
    let stdoutData = ''
    let stderrData = ''

    if (input) {
      proc.stdin.write(input)
      proc.stdin.end()
    } else {
      proc.stdin.end()
    }

    proc.stdout.on('data', (chunk) => { stdoutData += chunk.toString() })
    proc.stderr.on('data', (chunk) => { stderrData += chunk.toString() })

    proc.on('close', (codeExit) => {
      const out = stdoutData || stderrData || (codeExit === 0 ? 'Execution completed with no output.' : `Process exited with code ${codeExit}`)
      resolve({
        output: out.trimEnd(),
        error: codeExit !== 0 ? stderrData || `Exit code ${codeExit}` : ''
      })
    })

    proc.on('error', (err) => {
      // If python command failed on Windows, try 'py'
      if (command === 'python' && process.platform === 'win32') {
        const pyProc = spawn('py', args, { timeout: 6000 })
        let pyStdout = ''
        let pyStderr = ''
        if (input) { pyProc.stdin.write(input); pyProc.stdin.end() } else { pyProc.stdin.end() }
        pyProc.stdout.on('data', (c) => { pyStdout += c.toString() })
        pyProc.stderr.on('data', (c) => { pyStderr += c.toString() })
        pyProc.on('close', (cCode) => {
          resolve({
            output: (pyStdout || pyStderr || 'Execution completed with no output.').trimEnd(),
            error: cCode !== 0 ? pyStderr : ''
          })
        })
        pyProc.on('error', (e) => reject(e))
      } else {
        reject(err)
      }
    })
  })
}

// Groq AI Code Execution Simulator Helper
async function executeWithGroq(code: string, language: string, input: string) {
  const apiKey = process.env.GROQ_API_KEY || ''
  const model = process.env.AI_MODEL || 'openai/gpt-oss-120b'

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: model,
      messages: [
        {
          role: 'system',
          content: `You are an exact, deterministic programming language compiler and runtime simulator.
Execute the user's code with the supplied standard input (stdin).
If there is a compilation error or syntax error, produce the exact standard compiler error output in "output" and "error", and set "status": "Compilation Error".
If there is a runtime exception or crash, produce the runtime stack trace in "output" and "error", and set "status": "Runtime Error".
If the code runs successfully, produce the exact standard output (stdout) in "output", leave "error" empty, and set "status": "Success".
Respond ONLY with a valid JSON object matching this schema:
{
  "output": "string (stdout or compilation/runtime error)",
  "error": "string (error description if failed, otherwise empty string)",
  "status": "Success" | "Compilation Error" | "Runtime Error",
  "executionTime": "string (e.g. 0.04s)"
}
Output raw JSON only. Do not include markdown code block backticks.`
        },
        {
          role: 'user',
          content: `Language: ${language}
Standard Input (stdin):
${input || '(none)'}

Source Code:
${code}`
        }
      ],
      response_format: { type: 'json_object' }
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
  )

  const rawJson = response.data.choices?.[0]?.message?.content || '{}'
  return JSON.parse(rawJson)
}
