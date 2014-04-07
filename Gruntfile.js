module.exports = function(grunt) {
  // PATH where to store unzipped build
  var BUILD = process.env.KITT_EXT_BUILD_PATH || 'build';
  // PATH where to store final zip
  var DIST = process.env.KITT_EXT_DIST_PATH || 'dist';

  // Load task
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-crx');

  // Read extension manifest
  var manifest = grunt.file.readJSON('manifest.json');
  // Update version string
  var version = manifest.version.split('.');
  for (var i = version.length; i < 3; i++) {
    version.push(0);
  }
  version[2]++;
  manifest.version = version.join('.');

  var backgroundScripts = [];
  if (manifest.background && manifest.background.scripts) {
    backgroundScripts = manifest.background.scripts;
  }

  var contentScripts = [];
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach(function(content) {
      contentScripts = contentScripts.concat(content.js || []);
    });
  }

  var htmlPath = 'html';
  var html = htmlPath + '/**/*.html';
  var css = 'css/**/*.css';
  var js = 'js/**/*.js';

  // Grunt config
  grunt.initConfig({
    jshint: {
      options: {
        undef: true,
        unused: false,
        globals: {
          'document': false, 'console': false, 'alert': false, 'chrome': false,
          'module': false, 'process': false, 'window': false, '$': false
        }
      },
      files: [js]
    },
    bumpup: {
      setters: {
        name: function(old, releaseType, options) {
          return manifest.name;
        },
        version: function(old, releaseType, options) {
          return manifest.version;
        },
        description: function(old, releaseType, options) {
          return manifest.description;
        },
        author: function(old, releaseType, options) {
          return manifest.author;
        }
      },
      files: [
        'manifest.json', 'bower.json', 'package.json'
      ]
    },
    exec: {
      bower: {
        command: 'bower install'
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, src: [html, css, 'images/**/*', 'manifest.json'], dest: BUILD},
          {expand: true, src: backgroundScripts, dest: BUILD},
          {expand: true, src: contentScripts, dest: BUILD}
        ]
      }
    },
    useminPrepare: {
      html: html,
      options: {
        flow: {
          steps: {js: ['concat'], css: ['concat']},
          post: []
        },
        dest: BUILD + '/' + htmlPath
      }
    },
    usemin: {
      html: BUILD + '/' + html
    },
    crx: {
      main: {
        src: [BUILD+'/**'],
        dest: DIST,
        filename: manifest.name+'.crx',
        baseURL: 'http://localhost:8777/', // clueless default
        privateKey: BUILD+'/../key.pem'
      }
    }
  });

  // --------------------
  // handle kitt extension without html pages
  if (grunt.file.expand(html).length === 0) {
    grunt.registerTask('_usemin', []);
  } else {
    grunt.registerTask('_usemin', ['useminPrepare', 'concat', 'usemin']);
  }

  grunt.registerTask('default', ['jshint', 'bumpup', 'exec:bower', 'copy', '_usemin', 'crx']);
};
