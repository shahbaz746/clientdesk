function sanitizeUser(user) {
  if (!user) return null;
  const doc = user.toObject ? user.toObject() : user;
  delete doc.passwordHash;
  return doc;
}

module.exports = sanitizeUser;
