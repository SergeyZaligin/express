const express = require('express');
const app = express();
var fortune = require('./lib/fortune.js');
var weather = require('./lib/weather');
var express_handlebars_sections = require('express-handlebars-sections');
const PORT = 3000;

app.set('port', process.env.PORT || PORT);
app.set('view cache', false);
// Установка механизма представления handlebars
var handlebars = require('express-handlebars').create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
express_handlebars_sections(handlebars);

app.use(express.static(__dirname + '/public'));
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

// Отключить заголовки
app.disable('x-powered-by');

app.get('/', function (req, res) {
    res.render('home');
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
    res.json({animal: 'squirrel', bodyPart: 'tail', adjective: 'bushy', noun: 'heck'});
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
