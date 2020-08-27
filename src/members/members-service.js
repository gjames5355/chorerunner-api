const MembersService = {
  validatePassword(password) {
    if (password.length <= 3) {
      return 'Password must be 4 characters or more';
    }
    if (password.length >= 11) {
      return 'Password be less than 10 characters';
    }
    if (password.startsWith(' ') || password.endsWith(' ')) {
      return 'Password must not start or end with empty spaces';
    }
    return null;
  },
};

module.exports = MembersService;
