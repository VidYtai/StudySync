const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

// Define file paths relative to the project root
const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.txt');
const ROOMS_FILE = path.join(DATA_DIR, 'study_rooms.txt');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.txt');
const INVITES_FILE = path.join(DATA_DIR, 'invites.txt');

const DELIMITER = '::';
const RECORD_SEPARATOR = '\n';
const MEMBER_ID_SEPARATOR = ',';

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch (e) {
        if (e.code === 'ENOENT') {
            await fs.mkdir(DATA_DIR);
        } else {
            throw e;
        }
    }
};

// --- Generic File Operations ---
const readFile = async (filePath) => {
    await ensureDataDir();
    try {
        await fs.access(filePath);
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') return ''; // File doesn't exist
        throw error;
    }
};

const writeFile = async (filePath, content) => {
    await ensureDataDir();
    await fs.writeFile(filePath, content, 'utf-8');
};

// --- Security ---
const hashString = (str) => {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
};

// --- Data Parsers & Serializers ---
const parseLine = (line, fields) => {
    const values = line.split(DELIMITER);
    const obj = {};
    fields.forEach((field, index) => {
        obj[field] = values[index];
    });
    return obj;
};

const serializeLine = (obj, fields) => {
    return fields.map(field => obj[field] || '').join(DELIMITER);
};

// --- User Operations ---
const USER_FIELDS = ['id', 'name', 'password', 'securityQuestion', 'securityAnswer'];
const getUsers = async () => {
    const content = await readFile(USERS_FILE);
    if (!content) return [];
    return content.split(RECORD_SEPARATOR).filter(Boolean).map(line => parseLine(line, USER_FIELDS));
};
const saveUsers = async (users) => {
    const content = users.map(u => serializeLine(u, USER_FIELDS)).join(RECORD_SEPARATOR);
    await writeFile(USERS_FILE, content);
};

// --- Room Operations ---
const ROOM_FIELDS = ['id', 'name', 'password', 'ownerId', 'memberIds'];
const getRooms = async () => {
    const content = await readFile(ROOMS_FILE);
    if (!content) return [];
    return content.split(RECORD_SEPARATOR).filter(Boolean).map(line => {
        const room = parseLine(line, ROOM_FIELDS);
        room.memberIds = room.memberIds ? room.memberIds.split(MEMBER_ID_SEPARATOR) : [];
        return room;
    });
};
const saveRooms = async (rooms) => {
    const content = rooms.map(r => {
        const serializableRoom = {...r, memberIds: r.memberIds.join(MEMBER_ID_SEPARATOR)};
        return serializeLine(serializableRoom, ROOM_FIELDS);
    }).join(RECORD_SEPARATOR);
    await writeFile(ROOMS_FILE, content);
};

// --- Message Operations ---
const MESSAGE_FIELDS = ['id', 'roomId', 'text', 'senderId', 'senderName', 'timestamp'];
const getMessages = async () => {
    const content = await readFile(MESSAGES_FILE);
    if (!content) return [];
    return content.split(RECORD_SEPARATOR).filter(Boolean).map(line => parseLine(line, MESSAGE_FIELDS));
};
const saveMessages = async (messages) => {
    const content = messages.map(m => serializeLine(m, MESSAGE_FIELDS)).join(RECORD_SEPARATOR);
    await writeFile(MESSAGES_FILE, content);
};

// --- Invite Operations ---
const INVITE_FIELDS = ['id', 'roomId', 'roomName', 'inviterName', 'inviteeId', 'status'];
const getInvites = async () => {
    const content = await readFile(INVITES_FILE);
    if (!content) return [];
    return content.split(RECORD_SEPARATOR).filter(Boolean).map(line => parseLine(line, INVITE_FIELDS));
};
const saveInvites = async (invites) => {
    const content = invites.map(i => serializeLine(i, INVITE_FIELDS)).join(RECORD_SEPARATOR);
    await writeFile(INVITES_FILE, content);
};


module.exports = {
    hashString,
    getUsers, saveUsers,
    getRooms, saveRooms,
    getMessages, saveMessages,
    getInvites, saveInvites
};
