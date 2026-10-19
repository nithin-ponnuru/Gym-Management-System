/**
 * socketManager.js
 * 
 * Singleton that holds the Socket.IO instance and a map of
 * authenticated admin socket IDs, so any controller can emit
 * admin notifications without importing `server.js`.
 */

let _io = null;

// Set of socket IDs that belong to authenticated admins
const adminSockets = new Set();

const setIO = (ioInstance) => {
  _io = ioInstance;
};

const getIO = () => {
  if (!_io) throw new Error('Socket.IO not initialized');
  return _io;
};

const addAdminSocket = (socketId) => adminSockets.add(socketId);
const removeAdminSocket = (socketId) => adminSockets.delete(socketId);
const getAdminSockets = () => [...adminSockets];

/**
 * Emit an event to all connected admin sockets.
 * Safe to call even if no admins are connected.
 */
const emitToAdmins = (event, data) => {
  if (!_io) return;
  _io.to('admin').emit(event, data);
};

module.exports = { setIO, getIO, emitToAdmins, addAdminSocket, removeAdminSocket, getAdminSockets };
