const express = require('express');
const app = express();
const fortune = require('./lib/fortune.js');
const weather = require('./lib/weather');
const express_handlebars_sections = require('express-handlebars-sections');
const formidable = require('formidable');
const credentials = require('./credentials.js');
const axios = require('axios');
const connect = require('connect');
const nodemailer = require('nodemailer');
require('./app_cluster.js');

switch (app.get('env')) {
    case 'development':
        // сжатое многоцветное журналирование для
        // разработки
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // модуль 'express-logger' поддерживает ежедневное
        // чередование файлов журналов
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}

function wrappMail() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    nodemailer.createTestAccount((err, account) => {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: credentials.gmail.user, // generated ethereal user
                pass: credentials.gmail.password // generated ethereal password
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Fred Foo 👻" <codename.cobweb@gmail.com>', // sender address
            to: 'cplusplusjs@gmail.com', // list of receivers
            subject: 'Hello ✔', // Subject line
            text: 'Hello world?', // plain text body
            html: '<b>Hello world?</b>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
}


function wrappAxios() {
    axios.get('https://api.tvmaze.com/search/shows?q=batman')
        .then(function (response) {
            console.log(response.data);
        })
        .catch(function (error) {
            console.log(error);
        });
}



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
app.use(function (req, res, next) {
    var cluster = require('cluster');
    if (cluster.isWorker) console.log('Исполнитель %d получил запрос ',
        cluster.worker.id);
    next();
});
// Отключить заголовки
app.disable('x-powered-by');

app.use(function (req, res, next) {
    // создаем домен для этого запроса
    var domain = require('domain').create();
    // обрабатываем ошибки на этом домене
    domain.on('error', function (err) {
        console.error('ПЕРЕХВАЧЕНА ОШИБКА ДОМЕНА\n', err.stack);
        try {
            // Отказобезопасный останов через 5 секунд
            setTimeout(function () {
                console.error(' Отказобезопасный останов.');
                process.exit(1);
            }, 5000);
            // Отключение от кластера
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();
            // Прекращение принятия новых запросов
            server.close();
            try {
                // Попытка использовать маршрутизацию
                // ошибок Express
                next(err);
            } catch (err) {
                // Если маршрутизация ошибок Express не сработала,
                // пробуем выдать текстовый ответ Node
                console.error('Сбой механизма обработки ошибок ' +
                    'Express .\n', err.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Ошибка сервера.');
            }
        } catch (err) {
            console.error('Не могу отправить ответ 500.\n', err.stack);
        }
    });
    // Добавляем объекты запроса и ответа в домен
    domain.add(req);
    domain.add(res);
    // Выполняем оставшуюся часть цепочки запроса в домене
    domain.run(next);
});

// app.get('/epic-fail', function (req, res) {
//     process.nextTick(function () {
//         throw new Error('Бабах!');
//     });
// });

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



function startServer() {
    app.listen(app.get('port'), function () {
        console.log('Express запущен в режиме ' + app.get('env') +
            ' на http://localhost:' + app.get('port') +
            '; нажмите Ctrl+C для завершения.');
    });
}

if (require.main === module) {
    // Приложение запускается непосредственно;
    // запускаем сервер приложения
    startServer();
} else {
    // Приложение импортируется как модуль
    // посредством "require":
    // экспортируем функцию для создания сервера
    module.exports = startServer;
}
