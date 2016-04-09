var jsfiles = [
	'src/_components/jquery/dist/jquery.js',
	'src/_components/jquery-migrate/jquery-migrate.js',
	'src/_components/js-cookie/src/js.cookie.js',
	'src/_components/bootstrap/build/js/bootstrap.js',
	'src/utils.js',
	'src/smcplus.js'
];

var cssfiles = [
	'src/_components/bootstrap/dist/css/bootstrap.css',
	'src/_components/bootstrap/dist/css/bootstrap-theme.css',
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
						src: ['src/_components/bootstrap/fonts/*'],
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
		},

		rsync: {
			prod: {
				options: {
					src: 'build/',
					dest: 'cuarentaydos.com/SMC+/',
					host: 'xuzo@cuarentaydos.com',
					dryRun: false,
					delete: false,
					recursive: true
				}
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-processhtml');
	grunt.loadNpmTasks('grunt-rsync');

	grunt.registerTask('default', ['concat', 'uglify', 'cssmin', 'copy', 'processhtml']);
	grunt.registerTask('upload', ['rsync'])
};

