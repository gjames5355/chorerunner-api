const express = require('express');
const membersAuthService = require('./members-auth-service');
const { requireMemberAuth } = require('../middleware/member-jwt');

const membersAuthRouter = express.Router();
const jsonBodyParser = express.json();

membersAuthRouter
  .route('/token')
  .post(jsonBodyParser, async (req, res, next) => {
    const { username, password } = req.body;
    const loginMember = { username, password };

    for (const [key, value] of Object.entries(loginMember))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`,
        });

    try {
      const dbMember = await membersAuthService.getMemberwithMemberName(
        req.app.get('db'),
        loginMember.username
      );

      if (!dbMember)
        return res.status(400).json({
          error: 'Incorrect username or password',
        });

      const compareMatch = await membersAuthService.comparePasswords(
        loginMember.password,
        dbMember.password
      );

      if (!compareMatch)
        return res.status(400).json({
          error: 'Incorrect username or password',
        });

      const sub = dbMember.username;
      const payload = {
        user_id: dbMember.id,
        name: dbMember.name,
        household_id: dbMember.household_id,
        type: 'member',
      };
      res.send({
        authToken: membersAuthService.createJwt(sub, payload),
        type: 'member',
      });
    } catch (error) {
      next(error);
    }
  })

  .put(requireMemberAuth, (req, res) => {
    const sub = req.member.username;
    const payload = {
      member_id: req.member.id,
      name: req.member.name,
    };
    res.send({
      authToken: membersAuthService.createJwt(sub, payload),
    });
  });

module.exports = membersAuthRouter;
