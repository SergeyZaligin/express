const express = require('express');
const app = express();
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather');
var express_handlebars_sections = require('express-handlebars-sections');
var formidable = require('formidable');
var credentials = require('./credentials.js');

const PORT = 3000;
// Немного измененная версия официального регулярного выражения
// W3C HTML5 для электронной почты:
// https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
const VALID_EMAIL_REGEX = new RegExp('^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@' +
'[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?' +
'(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$');

app.set('port', process.env.PORT || PORT);
app.set('view cache', false);

// Установка механизма представления handlebars
var handlebars = require('express-handlebars').create({
    defaultLayout: 'main'
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
express_handlebars_sections(handlebars);

app.use(express.static(__dirname + '/public'));
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
}));
app.use(require('body-parser').urlencoded({
    extended: true
}));
app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});
app.use(function (req, res, next) {
    if (!res.locals.partials)
        res.locals.partials = {};
    res.locals.partials.weatherContext = weather.getWeatherData();
    next();
});
app.use(function (req, res, next) {
    // Если имеется экстренное сообщение,
    // переместим его в контекст, а затем удалим
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});
// Отключить заголовки
app.disable('x-powered-by');



app.get('/', function (req, res) {
    res.cookie('monster', 'nom nom');
    res.cookie('signed_monster', 'nom nom', {
        signed: true
    });
    var monster = req.cookies.monster;
    var signedMonster = req.signedCookies.signed_monster;
    res.render('home', {
        cookie: monster
    });
});

app.get('/contest/vacation-photo', function (req, res) {
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(),
        month: now.getMonth()
    });
});

app.post('/contest/vacation-photo/:year/:month', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        res.redirect(303, '/thank-you');
    });
});

app.get('/newsletter', function (req, res) {
    // мы изучим CSRF позже... сейчас мы лишь
    // заполняем фиктивное значение
    res.render('newsletter', {
        csrf: 'CSRF token goes here'
    });
});

app.post('/process', function (req, res) {
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    res.redirect(303, '/thank-you');
});

app.post('/processs', function (req, res) {
    if (req.xhr || req.accepts('json,html') === 'json') {
        // если здесь есть ошибка, то мы должны отправить { error: 'описание ошибки' }
        res.send({
            success: true
        });
    } else {
        // если бы была ошибка, нам нужно было бы перенаправлять на страницу ошибки
        res.redirect(303, '/thank-you');
    }
});

app.get('/jquery-test', function (req, res) {
    res.render('jquery-test');
});

app.get('/about', function (req, res) {
    res.render('about', {
        fortune: fortune.getFortune(),
        pageTestScript: '/qa/tests-about.js'
    });
});

app.get('/tours/hood-river', function (req, res) {
    res.render('tours/hood-river');
});

app.get('/tours/request-group-rate', function (req, res) {
    res.render('tours/request-group-rate');
});

app.get('/nursery-rhyme', function (req, res) {
    res.render('nursery-rhyme');
});

app.get('/data/nursery-rhyme', function (req, res) {
    res.json({
        animal: 'squirrel',
        bodyPart: 'tail',
        adjective: 'bushy',
        noun: 'heck'
    });
});

// Set headers
app.get('/headers', function (req, res) {
    res.set('Content-Type', 'text/plain');
    var s = '';
    for (var name in req.headers)
        s += name + ': ' + req.headers[name] + '\n';
    res.send(s);
});

// Обобщенный обработчик 404 (промежуточное ПО)
app.use(function (req, res, next) {
    res.status(404);
    res.render('404');
});

// Обработчик ошибки 500 (промежуточное ПО)
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function () {
    console.log('Express запущен на http://localhost:' + app.get('port') + '; нажмите Ctrl+C для завершения.');
});
