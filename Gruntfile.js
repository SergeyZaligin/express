module.exports = function (grunt) {

    // load plugins
    [
        'grunt-cafe-mocha',
        'grunt-exec',
    ].forEach(function (task) {
        grunt.loadNpmTasks(task);
    });

    // configure plugins
    grunt.initConfig({
        cafemocha: {
            all: {
                src: 'qa/tests-*.js',
                options: {
                    ui: 'tdd'
                },
            }
        },
        
    });

    // register tasks
    grunt.registerTask('default', ['cafemocha']);
};
