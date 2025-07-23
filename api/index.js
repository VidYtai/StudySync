const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
const db = require('./db');

const app = express();
const port = 3001; // Port for the backend server

// --- Middleware Setup ---
app.use(cors({
  origin: 'http://localhost:3000', // Adjust for your frontend URL in development
  credentials: true,
}));
app.use(bodyParser.json());
app.use(session({
  store: new FileStore({ path: path.join(__dirname, '../../sessions'), logFn: function(){} }),
  secret: 'a-super-secret-key-for-studysync', // In production, use an env variable
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 1000 * 60 * 60 * 24 * 7 } // 1 week
}));

const authGuard = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    next();
};

// --- Routes ---

// Auth Routes
const authRouter = express.Router();

authRouter.post('/signup', async (req, res) => {
    const { name, password, securityQuestion, securityAnswer } = req.body;
    if (!name || !password || !securityQuestion || !securityAnswer) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    const users = await db.getUsers();
    if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ message: 'User with this name already exists.' });
    }
    const newUser = {
        id: crypto.randomUUID(),
        name,
        password: db.hashString(password),
        securityQuestion,
        securityAnswer: db.hashString(securityAnswer),
    };
    await db.saveUsers([...users, newUser]);
    
    const { password: _, securityAnswer: __, ...userForSession } = newUser;
    req.session.user = userForSession;
    res.status(201).json(userForSession);
});

authRouter.post('/login', async (req, res) => {
    const { name, password } = req.body;
    const users = await db.getUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());

    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.password !== db.hashString(password)) {
        return res.status(401).json({ message: 'Invalid password.' });
    }
    
    const { password: _, securityAnswer: __, ...userForSession } = user;
    req.session.user = userForSession;
    res.status(200).json(userForSession);
});

authRouter.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Could not log out." });
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully.' });
    });
});

authRouter.get('/me', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

authRouter.post('/question', async (req, res) => {
    const { name } = req.body;
    const users = await db.getUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (user) {
        res.json({ question: user.securityQuestion });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

authRouter.post('/verify', async (req, res) => {
    const { name, answer } = req.body;
    const users = await db.getUsers();
    const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (user && user.securityAnswer === db.hashString(answer)) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

authRouter.post('/reset-password', async (req, res) => {
    const { name, newPassword } = req.body;
    let users = await db.getUsers();
    const userIndex = users.findIndex(u => u.name.toLowerCase() === name.toLowerCase());
    if (userIndex > -1) {
        users[userIndex].password = db.hashString(newPassword);
        await db.saveUsers(users);
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

app.use('/api/auth', authRouter);

// User search
app.get('/api/users', authGuard, async (req, res) => {
    const { name, id } = req.query;
    const users = await db.getUsers();
    let user;
    if (name) {
       user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    } else if (id) {
       user = users.find(u => u.id === id);
    }

    if (user) {
        const { password, securityQuestion, securityAnswer, ...safeUser } = user;
        res.json(safeUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});


// Study Room Routes
const studyRoomRouter = express.Router();
studyRoomRouter.use(authGuard);

studyRoomRouter.get('/', async (req, res) => {
    const rooms = await db.getRooms();
    res.json(rooms);
});

studyRoomRouter.post('/', async (req, res) => {
    const { name, password } = req.body;
    const rooms = await db.getRooms();
    if (rooms.some(r => r.name.toLowerCase() === name.toLowerCase())) {
        return res.status(409).json({ message: 'Room name already exists' });
    }
    const newRoom = {
        id: crypto.randomUUID(),
        name,
        password: db.hashString(password),
        ownerId: req.session.user.id,
        memberIds: [req.session.user.id],
    };
    await db.saveRooms([...rooms, newRoom]);
    res.status(201).json(newRoom);
});

studyRoomRouter.post('/join', async (req, res) => {
    const { name, password } = req.body;
    let rooms = await db.getRooms();
    const roomIndex = rooms.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
    if (roomIndex === -1) return res.status(404).json({ message: 'Room not found' });
    
    const room = rooms[roomIndex];
    if (room.password !== db.hashString(password)) {
        return res.status(401).json({ message: 'Incorrect password' });
    }
    
    if (!room.memberIds.includes(req.session.user.id)) {
        rooms[roomIndex].memberIds.push(req.session.user.id);
        await db.saveRooms(rooms);
    }
    res.json(rooms[roomIndex]);
});

studyRoomRouter.post('/:id/leave', async (req, res) => {
    let rooms = await db.getRooms();
    let messages = await db.getMessages();
    const roomIndex = rooms.findIndex(r => r.id === req.params.id);

    if (roomIndex > -1) {
        rooms[roomIndex].memberIds = rooms[roomIndex].memberIds.filter(id => id !== req.session.user.id);
        if (rooms[roomIndex].memberIds.length === 0) {
            // Delete room and its messages
            rooms.splice(roomIndex, 1);
            messages = messages.filter(m => m.roomId !== req.params.id);
            await db.saveMessages(messages);
        }
        await db.saveRooms(rooms);
    }
    res.status(200).json({ message: 'Left room' });
});

// Messages
studyRoomRouter.get('/:roomId/data', async(req, res) => {
    const { roomId } = req.params;
    const [messages, rooms, users] = await Promise.all([db.getMessages(), db.getRooms(), db.getUsers()]);
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!room.memberIds.includes(req.session.user.id)) {
        return res.status(403).json({ message: "Not a member of this room" });
    }

    const roomMessages = messages.filter(m => m.roomId === roomId);
    const participantIds = new Set(room.memberIds);
    const participants = users.filter(u => participantIds.has(u.id)).map(u => ({id: u.id, name: u.name}));

    res.json({ messages: roomMessages, participants });
});

studyRoomRouter.post('/:roomId/messages', async (req, res) => {
    const { text } = req.body;
    const newMessage = {
        id: crypto.randomUUID(),
        roomId: req.params.roomId,
        text,
        senderId: req.session.user.id,
        senderName: req.session.user.name,
        timestamp: new Date().toISOString()
    };
    const messages = await db.getMessages();
    await db.saveMessages([...messages, newMessage]);
    res.status(201).json(newMessage);
});

// Invites
studyRoomRouter.get('/invites', async (req, res) => {
    const allInvites = await db.getInvites();
    const userInvites = allInvites.filter(i => i.inviteeId === req.session.user.id && i.status === 'pending');
    res.json(userInvites);
});

studyRoomRouter.post('/:roomId/invite', async (req, res) => {
    const { inviteeName } = req.body;
    const { roomId } = req.params;
    
    const users = await db.getUsers();
    const rooms = await db.getRooms();
    const invites = await db.getInvites();

    const targetUser = users.find(u => u.name.toLowerCase() === inviteeName.toLowerCase());
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (targetUser.id === req.session.user.id) return res.status(400).json({ message: "You can't invite yourself" });

    const room = rooms.find(r => r.id === roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.memberIds.includes(targetUser.id)) return res.status(409).json({ message: 'User is already in the room' });
    if (invites.some(i => i.roomId === roomId && i.inviteeId === targetUser.id && i.status === 'pending')) {
        return res.status(409).json({ message: 'User already has a pending invite' });
    }

    const newInvite = {
        id: crypto.randomUUID(),
        roomId,
        roomName: room.name,
        inviterName: req.session.user.name,
        inviteeId: targetUser.id,
        status: 'pending'
    };
    await db.saveInvites([...invites, newInvite]);
    res.status(201).json(newInvite);
});

studyRoomRouter.post('/invites/:inviteId/accept', async (req, res) => {
    let invites = await db.getInvites();
    let rooms = await db.getRooms();
    const { inviteId } = req.params;

    const inviteIndex = invites.findIndex(i => i.id === inviteId && i.inviteeId === req.session.user.id);
    if (inviteIndex === -1) return res.status(404).json({ message: 'Invite not found' });

    const invite = invites[inviteIndex];
    invites[inviteIndex].status = 'accepted';
    
    const roomIndex = rooms.findIndex(r => r.id === invite.roomId);
    if (roomIndex > -1 && !rooms[roomIndex].memberIds.includes(req.session.user.id)) {
        rooms[roomIndex].memberIds.push(req.session.user.id);
    }

    await Promise.all([db.saveInvites(invites), db.saveRooms(rooms)]);
    res.json(rooms.find(r => r.id === invite.roomId));
});

studyRoomRouter.post('/invites/:inviteId/decline', async (req, res) => {
    let invites = await db.getInvites();
    const { inviteId } = req.params;
    const inviteIndex = invites.findIndex(i => i.id === inviteId && i.inviteeId === req.session.user.id);

    if (inviteIndex > -1) {
        invites[inviteIndex].status = 'declined';
        await db.saveInvites(invites);
    }
    res.status(200).json({ message: 'Invite declined' });
});

app.use('/api/study-rooms', studyRoomRouter);

// Fallback for serving frontend (optional, depending on setup)
// In a real setup, a reverse proxy like Nginx would handle this.
if (process.env.NODE_ENV !== 'development') {
    app.use(express.static(path.join(__dirname, '../..')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../index.html'));
    });
}


if (process.env.NODE_ENV === 'development') {
    app.listen(port, () => {
      console.log(`Backend server listening on http://localhost:${port}`);
    });
}

// Export the app for serverless environments
module.exports = app;
