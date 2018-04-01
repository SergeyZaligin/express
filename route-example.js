var app = require('express')();

app.use(function (req, res, next) {
    console.log('\n\nВСЕГДА');
    next();
});
app.get('/a', function (req, res) {
    console.log('/a: маршрут завершен');
    res.send('a');
});
app.get('/a', function (req, res) {
    console.log('/a: никогда не вызывается');
});
app.get('/b', function (req, res, next) {
    console.log('/b: маршрут не завершен ');
    next();
});
app.use(function (req, res, next) {
    console.log('ИНОГДА');
    next();
});
app.get('/b', function (req, res, next) {
    console.log('/b (part 2): сгенерирована ошибка');
    throw new Error('b не выполнено');
});
app.use('/b', function (err, req, res, next) {
    console.log('/b ошибка обнаружена и передана далее');
    next(err);
});
app.get('/c', function (err, req) {
    console.log('/c: сгенерирована ошибка ');
    throw new Error('c не выполнено ');
});
app.use('/c', function (err, req, res, next) {
            console.log('/c: ошибка обнаружена, но не переданадалее ');
                next();
            }); app.use(function (err, req, res, next) {
            console.log('обнаружена необработанная ошибка: ' +
                err.message);
            res.send('500 - Ошибка сервера');
        }); app.use(function (req, res) {
            console.log('маршрут не обработан');
            res.send('404 - Не найдено');
        }); app.listen(3000, function () {
            console.log('слушаю на порте 3000');
        });
