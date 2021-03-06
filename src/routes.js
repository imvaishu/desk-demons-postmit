const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cookieEncrypter = require('cookie-encrypter');
const userRoute = require('./userRoute');
const handlers = require('./handlers');
const { COOKIE_SECRET, NODE_ENV } = require('../config');

const app = express();

app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');

app.use(morgan('dev', { skip: () => NODE_ENV === 'test' }));
app.use(cookieParser(COOKIE_SECRET));
app.use(cookieEncrypter(COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.get('/', handlers.serveIndexPage);
app.get('/auth', handlers.authorizeUser);
app.get('/callback', handlers.handleUserProfile);
app.post('/save-user', handlers.saveUser);
app.post('/isUsernameAvailable', handlers.checkUsernameAvailability);
app.use(userRoute);

module.exports = app;
