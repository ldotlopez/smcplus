var jsfiles = [
	'node_modules/jquery/dist/jquery.js',
	'node_modules/jquery-migrate/dist/jquery-migrate.js',
	'node_modules/js-cookie/src/js.cookie.js',
	'node_modules/bootstrap/build/js/bootstrap.js',
	'src/utils.js',
	'src/smcplus.js'
];

var cssfiles = [
	'node_modules/bootstrap/dist/css/bootstrap.css',
	'node_modules/bootstrap/dist/css/bootstrap-theme.css',
	'src/smcplus.css'
];

module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			js: {
				options: {
					separator: ';'
				},
				src: jsfiles,
				dest: 'build/<%= pkg.name %>.js'
			},
			css: {
				src: cssfiles,
				dest: 'build/<%= pkg.name %>.css'
			}
		},

		uglify: {
			options: {
				// the banner is inserted at the top of the output
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'build/<%= pkg.name %>.min.js': ['<%= concat.js.dest %>']
				}
			}
		},

		cssmin: {
			options: {
				shorthandCompacting: false,
				roundingPrecision: -1
			},
			target: {
				files: {
					'build/<%= pkg.name %>.min.css': '<%= concat.css.dest %>'
				}
			}
		},

		copy: {
			main: {
				files: [
					{
						src: ['node_modules/bootstrap/fonts/*'],
						dest: 'build/fonts/',
						expand: true,
						flatten: true
					},
					{
						src: ['src/*.php'],
						dest: 'build/',
						expand: true,
						flatten: true
					},
				]
			}
		},

		processhtml: {
			dist: {
				files: {
					'build/index.html': ['src/index.html']
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-processhtml');

	grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'copy', 'processhtml']);
};

