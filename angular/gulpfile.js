//////////////////
// Dependencies //
//////////////////

var concat		= require("gulp-concat");
var crypto		= require("crypto");
var gulp		= require("gulp");
var http		= require("http");
var mkdirp		= require("mkdirp");
var open		= require("open");
var static		= require("node-static");
var _			= require("lodash");
var WebSocket	= require("faye-websocket");
var Q			= require("q");
var spawn		= require("child_process").spawn;
var preprocess	= require("gulp-preprocess");



////////////////////////////////
// Build app assets functions //
////////////////////////////////

var appHtml = function (dest, target) {
	console.log("Building app html");
	var deferred = Q.defer();
	gulp.src("app/index.html")
		.pipe(preprocess({context: {TARGET: target}}))
		.pipe(gulp.dest(dest))
		.on("end", function () {
			deferred.resolve();
		});
	return deferred.promise;
};

var appScripts = function (dest) {
	console.log("Building app scripts");
	var deferred = Q.defer();
	gulp.src("app/**/*.js")
		.pipe(concat("app.js"))
		.pipe(gulp.dest(dest))
		.on("end", function () {
			deferred.resolve();
		});
	return deferred.promise;
};

var appStyles = function (dest) {
	console.log("Building app styles");
	var deferred = Q.defer();
	gulp.src("app/**/*.css")
		.pipe(concat("app.css"))
		.pipe(gulp.dest(dest))
		.on("end", function () {
			deferred.resolve();
		});
	return deferred.promise;
};



//////////////////////////////////////
// Build app dependencies functions //
//////////////////////////////////////

var vendorScripts = function (dest, target) {
	console.log("Building vendor scripts");
	var deferred = Q.defer();
	var sources = [
		"bower_components/angular/angular.js",
		"bower_components/bower-sockjs-client/sockjs.js",
		"bower_components/q/q.js",
		"bower_components/ddp.js/src/ddp.js"
	];
	if (target === "browser") {
		sources.push("bower_components/asteroid/dist/asteroid.browser.js");
	}
	if (target === "cordova") {
		sources.push("bower_components/asteroid/dist/asteroid.cordova.js");
	}
	sources.push("bower_components/asteroid/dist/plugins/github-login.js");
	gulp.src(sources)
		.pipe(concat("vendor.js"))
		.pipe(gulp.dest(dest))
		.on("end", function () {
			deferred.resolve();
		});
	return deferred.promise;
};

var vendorStyles = function (dest) {
	console.log("Building vendor styles");
	var deferred = Q.defer();
	var sources = [
		"bower_components/bootstrap/dist/css/bootstrap.css",
		"bower_components/bootstrap-social/bootstrap-social.css",
		"bower_components/font-awesome/css/font-awesome.css"
	];
	gulp.src(sources)
		.pipe(concat("vendor.css"))
		.pipe(gulp.dest(dest))
		.on("end", function () {
			deferred.resolve();
		});
	return deferred.promise;
};

var vendorFonts = function (dest) {
	console.log("Building vendor fonts");
	var deferred = Q.defer();
	var sources = [
		"bower_components/font-awesome/fonts/*"
	];
	gulp.src(sources)
		.pipe(gulp.dest(dest))
		.on("end", function () {
			deferred.resolve();
		});
	return deferred.promise;
};



////////////////////////////
// App building functions //
////////////////////////////

var buildBrowser = function (reload) {
	console.log("BUILDING FOR BROWSER");
	// Create necessary directories if they don't exist
	mkdirp.sync("dist/");
	mkdirp.sync("dist/css/");
	mkdirp.sync("dist/js/");
	mkdirp.sync("dist/fonts/");
	return Q.all([
		appHtml("dist/"),
		appScripts("dist/js/"),
		appStyles("dist/css/"),
		vendorScripts("dist/js/", "browser"),
		vendorStyles("dist/css/"),
		vendorFonts("dist/fonts/")
	]).then(function () {
		if (reload) {
			return reload();
		}
		console.log("BROWSER BUILD FINISHED");
	});
};



//////////////////////
// Web server setup //
//////////////////////

var serve = function () {
	// Set up WebSocket server to reload the browser
	var ws = {
		sockets: {},
		send: function (msg) {
			_.forEach(this.sockets, function (socket) {
				socket.send(msg);
			});
		}
	};
	// Set up static file server
	var file = new static.Server("./dist/", {cache: false});
	// Start the static/websocket server
	http
		.createServer()
		.on("request", function (req, res) {
			req.on("end", function () {
				file.serve(req, res);
			});
			req.resume();
		})
		.on("upgrade", function (req, sock, body) {
			if (req.url !== "/websocket" || !WebSocket.isWebSocket(req)) {
				return;
			}
			var key = crypto.randomBytes(16).toString("hex");
			ws.sockets[key] = new WebSocket(req, sock, body).on("close", function () {
				delete ws.sockets[key];
			});
		})
		.listen(8080, "0.0.0.0");
	return function reload () {
		ws.send("reload");
	};
};



////////////////////
// Building tasks //
////////////////////

gulp.task("buildBrowser", function () {
	return buildBrowser();
});


///////////////
// Main task //
///////////////

gulp.task("default", ["buildBrowser"], function () {

	var reload = serve();

	var building = false;
	// Listen for file changes and re-run tasks
	gulp.watch([
		"app/index.html",
		"app/**/*.js",
		"app/**/*.css"
	]).on("change", function () {
		if (building) {
			return;
		}
		Q()
			.then(function () {
				building = true;
				return buildBrowser(reload);
			})
			.then(function () {
				buidling = false;
			});
	});

	// Open a browser window
	open("http://localhost:8080/");

});
