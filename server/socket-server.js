const { createServer } = require('http')
const { Server } = require('socket.io')

const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const rooms = new Map()
const activeRooms = new Set()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('create-room', ({ roomId, role }) => {
    socket.join(roomId)
    rooms.set(roomId, { company: socket.id, student: null, studentName: null, createdAt: Date.now() })
    activeRooms.add(roomId)
    console.log(`Room created: ${roomId} by ${role}`)
    
    // Broadcast updated room list
    io.emit('rooms-updated', { rooms: Array.from(activeRooms) })
  })

  socket.on('join-room', ({ roomId, role, name }) => {
    socket.join(roomId)
    const room = rooms.get(roomId)
    if (room) {
      room.student = socket.id
      room.studentName = name
      rooms.set(roomId, room)
    }
    console.log(`User joined room: ${roomId} as ${role} (${name})`)
    socket.to(roomId).emit('user-joined', { userId: socket.id, name })
  })

  socket.on('get-active-rooms', () => {
    const roomList = Array.from(activeRooms).map(roomId => ({
      roomId,
      info: rooms.get(roomId)
    }))
    console.log('Sending active rooms:', roomList)
    socket.emit('active-rooms', { rooms: roomList })
  })

  // Code synchronization (support both hyphen and underscore)
  const handleCodeChange = ({ roomId, code }) => {
    if (roomId && code !== undefined) {
      socket.to(roomId).emit('code-update', { code })
    }
  }
  socket.on('code-change', handleCodeChange)
  socket.on('code_change', handleCodeChange)

  // Language change synchronization
  const handleLanguageChange = ({ roomId, language, code }) => {
    if (roomId && language) {
      socket.to(roomId).emit('language-change', { language, code })
    }
  }
  socket.on('language-change', handleLanguageChange)
  socket.on('language_change', handleLanguageChange)

  // Code execution output synchronization
  const handleCodeOutput = ({ roomId, output }) => {
    if (roomId && output !== undefined) {
      socket.to(roomId).emit('code-output', { output })
    }
  }
  socket.on('code-output', handleCodeOutput)
  socket.on('code_output', handleCodeOutput)

  // WebRTC Signaling
  socket.on('webrtc-offer', ({ roomId, offer }) => {
    console.log(`Relaying WebRTC offer for room ${roomId} from ${socket.id}`)
    socket.to(roomId).emit('webrtc-offer', { offer, from: socket.id })
  })

  socket.on('webrtc-answer', ({ roomId, answer }) => {
    console.log(`Relaying WebRTC answer for room ${roomId} from ${socket.id}`)
    socket.to(roomId).emit('webrtc-answer', { answer, from: socket.id })
  })

  socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('webrtc-ice-candidate', { candidate, from: socket.id })
  })

  // Session completion
  const handleSessionEnded = ({ roomId, score, feedback }) => {
    console.log(`Session ended for room ${roomId} with score ${score}`)
    socket.to(roomId).emit('session-score', { score, feedback })
  }
  socket.on('session-ended', handleSessionEnded)
  socket.on('session_ended', handleSessionEnded)

  socket.on('leave-room', ({ roomId }) => {
    socket.leave(roomId)
    const room = rooms.get(roomId)
    if (room) {
      if (room.student === socket.id) {
        room.student = null
        room.studentName = null
        socket.to(roomId).emit('user-left')
      } else if (room.company === socket.id) {
        rooms.delete(roomId)
        activeRooms.delete(roomId)
        socket.to(roomId).emit('user-left')
        io.emit('rooms-updated', { rooms: Array.from(activeRooms) })
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    for (const [roomId, room] of rooms.entries()) {
      if (room.company === socket.id) {
        rooms.delete(roomId)
        activeRooms.delete(roomId)
        io.to(roomId).emit('user-left')
        io.emit('rooms-updated', { rooms: Array.from(activeRooms) })
      } else if (room.student === socket.id) {
        room.student = null
        room.studentName = null
        io.to(roomId).emit('user-left')
      }
    }
  })
})

const PORT = process.env.SOCKET_PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

