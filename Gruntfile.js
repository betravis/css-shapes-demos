module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ["exercises/*.html", "demos/*.html", "js/*.js"],
      options: {
        globals: {
          jQuery: true
        },
        extract: "always"
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  grunt.registerTask('default', ['jshint']);

};