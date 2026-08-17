const { createServer } = require('http')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, turbo: false })
const handle = app.getRequestHandler()

const rooms = new Map()
const activeRooms = new Set()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('create-room', ({ roomId, role }) => {
      socket.join(roomId)
      rooms.set(roomId, { company: socket.id, student: null, createdAt: Date.now() })
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

    socket.on('code-change', ({ roomId, code }) => {
      socket.to(roomId).emit('code-update', { code })
    })

    socket.on('language-change', ({ roomId, language }) => {
      socket.to(roomId).emit('language-change', { language })
    })

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

    socket.on('session-ended', ({ roomId, score, feedback }) => {
      console.log(`Session ended for room ${roomId} with score ${score}`)
      socket.to(roomId).emit('session-score', { score, feedback })
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      for (const [roomId, room] of rooms.entries()) {
        if (room.company === socket.id || room.student === socket.id) {
          rooms.delete(roomId)
          activeRooms.delete(roomId)
          io.to(roomId).emit('user-left')
          io.emit('rooms-updated', { rooms: Array.from(activeRooms) })
        }
      }
    })
  })

  const PORT = parseInt(process.env.PORT || '3000', 10)
  httpServer.listen(PORT, (err) => {
    if (err) throw err
    console.log(`> PlaceIQ server listening on port ${PORT} with Socket.IO attached`)
  })
})
