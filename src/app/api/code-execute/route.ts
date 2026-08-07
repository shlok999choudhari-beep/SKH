import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { code, language, input } = await request.json()

    if (!code || !language) {
      return NextResponse.json({ error: 'Code and language required' }, { status: 400 })
    }

    const tempDir = join(process.cwd(), 'temp')
    try {
      mkdirSync(tempDir, { recursive: true })
    } catch (e) {}

    const timestamp = Date.now()
    let output = ''
    let error = ''

    try {
      switch (language) {
        case 'cpp':
          output = await executeCpp(code, input, tempDir, timestamp)
          break
        case 'python':
          output = await executePython(code, input, tempDir, timestamp)
          break
        case 'java':
          output = await executeJava(code, input, tempDir, timestamp)
          break
        default:
          return NextResponse.json({ error: 'Unsupported language' }, { status: 400 })
      }
    } catch (e: any) {
      error = e.message || 'Execution error'
      console.error('Execution error:', e)
    }

    return NextResponse.json({ output: output || '', error: error || '' })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function executeCpp(code: string, input: string, tempDir: string, timestamp: number) {
  const filename = join(tempDir, `code_${timestamp}.cpp`)
  const executable = join(tempDir, `code_${timestamp}`)
  
  writeFileSync(filename, code)
  
  try {
    // Compile with better error handling
    try {
      const { stderr: compileError } = await execAsync(`g++ "${filename}" -o "${executable}" 2>&1`, { timeout: 10000 })
      if (compileError && !compileError.includes('warning')) {
        throw new Error(`Compilation error: ${compileError}`)
      }
    } catch (e: any) {
      throw new Error(`Compilation failed: ${e.message}`)
    }
    
    // Execute
    let result = ''
    if (input) {
      const { stdout } = await execAsync(`echo "${input.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" | "${executable}"`, { timeout: 5000 })
      result = stdout
    } else {
      const { stdout } = await execAsync(`"${executable}"`, { timeout: 5000 })
      result = stdout
    }
    
    // Cleanup
    try { unlinkSync(filename) } catch {}
    try { unlinkSync(executable) } catch {}
    
    return result
  } catch (e: any) {
    try { unlinkSync(filename) } catch {}
    try { unlinkSync(executable) } catch {}
    throw new Error(e.message || 'Execution failed')
  }
}

async function executePython(code: string, input: string, tempDir: string, timestamp: number) {
  const filename = join(tempDir, `code_${timestamp}.py`)
  
  writeFileSync(filename, code)
  
  try {
    const { stdout, stderr } = await execAsync(
      input ? `echo "${input.replace(/"/g, '\\"')}" | python3 "${filename}"` : `python3 "${filename}"`,
      { timeout: 5000 }
    )
    
    try { unlinkSync(filename) } catch {}
    
    return stdout || stderr
  } catch (e: any) {
    try { unlinkSync(filename) } catch {}
    throw new Error(e.stderr || e.stdout || e.message)
  }
}

async function executeJava(code: string, input: string, tempDir: string, timestamp: number) {
  const classNameMatch = code.match(/public\s+class\s+(\w+)/)
  const className = classNameMatch ? classNameMatch[1] : 'Main'
  
  const filename = join(tempDir, `${className}.java`)
  
  writeFileSync(filename, code)
  
  try {
    // Compile
    await execAsync(`javac "${filename}"`, { timeout: 10000, cwd: tempDir })
    
    // Execute
    const { stdout, stderr } = await execAsync(
      input ? `echo "${input.replace(/"/g, '\\"')}" | java -cp "${tempDir}" ${className}` : `java -cp "${tempDir}" ${className}`,
      { timeout: 5000 }
    )
    
    // Cleanup
    try { unlinkSync(filename) } catch {}
    try { unlinkSync(join(tempDir, `${className}.class`)) } catch {}
    
    return stdout || stderr
  } catch (e: any) {
    try { unlinkSync(filename) } catch {}
    try { unlinkSync(join(tempDir, `${className}.class`)) } catch {}
    throw new Error(e.stderr || e.stdout || e.message)
  }
}
