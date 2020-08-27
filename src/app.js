require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const authRouter = require('./auth/auth-router');
const userRouter = require('./user/user-router');
const membersAuthRouter = require('./auth-members/members-auth');
const membersRouter = require('./members/members-router');

const householdsRouter = require('./households/households-router');

const app = express();

const { CLIENT_ORIGIN } = require('./config');
const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting));
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.get('/', (req, res) => {
  res.send('Hallo, Textbaustein!');
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/households', householdsRouter);
app.use('/api/membersAuth', membersAuthRouter);
app.use('/api/members', membersRouter);

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
