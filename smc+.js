"use strict";

var Defaults = {
	latitude: 39.9859896,
	longitude: -0.043105240,
	zoom: 15,
	apiKey: 'AIzaSyAbozrLWf95y2G6oz24ne3ONfaaOXhEVp0',
	language: 'es',
	AytoArea: 'Otras Areas de desperfecto.', // Areas -> Áreas
	AytoCause: 'Desconocido',
	AytoAPI: 'http://castello.es/web30/pages/generico_web10.php?cod1=383&cod2=615'
};
Defaults.invGeoLocationApi = (
	'https://maps.googleapis.com/maps/api/geocode/json?' +
	'key=' + Defaults.apiKey + '&' +
	'language='+ Defaults.language + '&'
);


var App = function () {
	this._init();
};

App.prototype._init = function (opts) {
	var self = this;

	this.currProfile = undefined;

	$('.nav .dropdown-menu').empty();

	// Setup 'profiles' cookie
	var profiles = Cookies.getJSON('profiles');
	if (profiles === undefined || $.isEmptyObject(profiles)) {
		Cookies.set('profiles', {});
		$('.nav .dropdown').hide();
		this.runProfileSetup();
	}
	else {
		var profiles = Cookies.getJSON('profiles');

		this.currProfileName = Object.keys(profiles)[0];
		this.currProfile = profiles[this.currProfileName];
		
		$('.nav .dropdown a').contents()[0].textContent = this.currProfileName;
		// $('.nav .dropdown-menu').append($('<li><a id="profile-op-add" href="#">Crear otro perfil</a></li>'));		
		$('.nav .dropdown-menu').append($('<li><a id="profile-op-delete" href="#">Cerrar sesi&oacute;n</a></li>'));
		$('.nav .dropdown').show();
		
		this.runTicket();
	}

	// Show / hide elements
	$('.nav #home-link').off('click');
	$('.nav #home-link').on('click', function () {
		self._init();
		return false;
	});

	$('.nav #about-link').off('click');
	$('.nav #about-link').on('click', function () {
		self.switchToPanel('about');
		return false;
	});

	$('#profile-setup form').off('submit')
	$('#profile-setup form').on('submit', function() {
		self.onProfileSubmitted();
		return false;
	});

	$('#ticket #locator').off('click');
	$('#ticket #locator').on('click', function () {
		self.setMarker();
		return false;
	});

	$('#ticket form').off('submit');
	$('#ticket form').on('submit', function () {
		self.onTicketSubmitted();
		return false;
	});

	$('#profile-op-add').click(function (e) {
		self.addProfile();
		return false;
	});

	$('#profile-op-delete').click(function (e) {
		self.deleteCurrentProfile();
		return false;
	});
};

App.prototype.addProfile = function () {
	var self = this;
	self._init({profile: undefined});
}

App.prototype.deleteCurrentProfile = function () {
	var self = this;

	var profiles = Cookies.getJSON('profiles');
	delete profiles[self.currProfileName];
	Cookies.set('profiles', profiles);

	self._init({profile: undefined});
}

/*
 * Switch to some smc-panel showing/hiding others
 */
App.prototype.switchToPanel = function (panel) {
	$('.smc-panel').hide();
	$('.smc-panel#' + panel).show();
}

App.prototype.resetApp = function () {
	// Reset profiles cookie
	try {
		$.each(Cookies.get(), function(key, value) {
			console.log("Remove cookie " + key);
			Cookies.remove(key);
		});
	}
	catch (e) {
	};

 	Cookies.set('profiles', {});

 	// Finally re-init app
 	this._init();
};


/*
 *
 * Map functionality
 *
 * - If user clicks anywhere in the map the marker is moved and the view is panned
 * - If geolocation is requested the behaviour is similar to the previous stament
 *
 */

/*
 * This function initilizes the map and adds listeners to some events
 */
App.prototype.initMap = function () {
	var self = this;

	function onMapClick (e) {
		self.setMarker({
			latitude: e.latLng.lat(),
			longitude: e.latLng.lng()
		});
		e.stop();
	}

	if (typeof self.map == 'object') {
		return;
	}

	self.map = new google.maps.Map(document.getElementById('map'), {
		center: {
			lat: Defaults.latitude,
			lng: Defaults.longitude
		},
    	zoom: Defaults.zoom
	});
	self.marker = new google.maps.Marker({map: self.map})
	self.marker_invGeoLocation = {}

	self.map.addListener('click', onMapClick);
}

/*
 * Moves marker and address info. coors == undefined causes geolocation
 */
App.prototype.setMarker = function (coords) {
	var self = this;

	function onGeoposition (geo) {
		self.setMarker({
			latitude: geo.coords.latitude,
			longitude: geo.coords.longitude
		});
	}

	function onInvGeoLocation (resp) {
		self.marker_invGeoLocation = resp.results[0];
		var label = (
			self.marker_invGeoLocation.address_components[0].short_name +
			", " +
			self.marker_invGeoLocation.address_components[1].short_name
		);
		$('#ticket #map-address').val(label);
	};

	if (coords === undefined) {
		navigator.geolocation.getCurrentPosition(onGeoposition);
		return;
	}

	self.marker.setPosition({
		lat: coords.latitude,
		lng: coords.longitude
	});

	self.map.panTo({
		lat: coords.latitude,
		lng: coords.longitude
	});

	var apiCall = (
		Defaults.invGeoLocationApi + 
		'latlng=' + self.marker.position.lat() + ',' + self.marker.position.lng()
	);
	$.get(apiCall, onInvGeoLocation);
}

/*
 * Phase 1: Profile setup.
 * This is simple form with some validations.
 */
App.prototype.runProfileSetup = function () {
	var self = this;
	this.switchToPanel('profile-setup');

	var toClean = ['name', 'surname', 'dni', 'email', 'address', 'cp', 'phone'];
	$.each(toClean, function(idx, name) {
		$('#profile-setup [name='+name+']').val('');
	});

	var x;

	var yearSelector = $('#profile-setup form [name="year"]')
		.empty();
	var nowYear = parseInt((new Date()).getFullYear()); 	
 	for (x = nowYear - 16; x >= nowYear - 100; x--) {
		var e = $('<option>').val(x).text(x);
		yearSelector.append(e);
	}

	var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
	var monthSelector = $('#profile-setup form [name="month"]')
		.empty();

	$.each(months, function(idx, val) {
		var e = $('<option>').val(idx + 1).text(val);
		monthSelector.append(e);
	});

	var daySelector = $('#profile-setup form [name="day"]')
		.empty();
 	for (x = 1; x <= 31; x++) {
		var e = $('<option>').val(x).text(x);
		daySelector.append(e);
	}

	$('#profile-setup').show();
	$('#ticket').hide();
};

App.prototype.onProfileSubmitted = function () {
	var self = this;

	function validateUserData(d) {
		var errors = [];

		var mustBeNonEmptyStrings = ['name', 'surname', 'phone', 'dni', 'cp', 'address'];
		var mustBeInt = ['day', 'year'];

		$.each(mustBeNonEmptyStrings, function(idx, name) {
			if (!Validators.isNonEmptyString(d[name])) {
				errors.push({
					name: name,
					messages: ['El campo no puede estar vacío']
				});
			}
		});

		$.each(mustBeInt, function(idx, name) {
			if (!Validators.isInt(d[name])) {
				errors.push({
					name: name,
					messages: ['El campo debe ser un entero']
				});
			}
		});

		if (!Validators.isInt(d['month'])) {
			errors.push({
				name: 'month',
				messages: ['Valor invalido']
			})
		}

		return errors;
	}

	var profiles = Cookies.getJSON('profiles');
	var userData = this._getFormData($('#profile-setup form'));

	var errors = validateUserData(userData);
	if (errors.length) {
		Forms.displayErrors($('#profile-setup form'), errors);
		return;
	}

	var profileName = userData['name'] + " " + userData['surname'];

	profiles[profileName] = userData;
	Cookies.set('profiles', profiles, {expires: 3650});

	console.log("Saved profile '"+ profileName +"'");
	self._init();
};

/*
 * Phase 2: Ticket creation
 * Form + Google Maps
 */
App.prototype.runTicket = function () {
	var self = this;

	self.switchToPanel('ticket');
	self.initMap();

	var form = new Validators.Form($('#ticket form'));
	form.clearErrors();

	$('#ticket #debug').hide();
}

App.prototype.onTicketSubmitted = function () {
	var self = this;

	function validateForm () {
		var form = new Validators.Form($('#ticket form'));
		var data = form.getData();

		form.clearErrors();

		if (!Validators.isNonEmptyString(data['problem'])) {
			form.displayError('problem', 'Debe especificar un problema');
		}

		if (!Validators.isNonEmptyString(self.marker_invGeoLocation.address_components[0].short_name) ||
			!Validators.isNonEmptyString(self.marker_invGeoLocation.address_components[1].short_name) ||
			self.marker_invGeoLocation.address_components[ ]
			form.displayError('address', 'Direcci&oacute;n vac&iacute;a o invalida');
		}

		return !form.hasErrors();
	}

	if (!validateForm()) {
		return;
	}

	var d = new Date();
	var ticketData = {
		/* Profile data */
		nombre: this.currProfile.name,
		apellidos: this.currProfile.surname,
		dni: self.currProfile.dni,
		direccion: self.currProfile.address,
		cp: self.currProfile.cp,
		telefono: self.currProfile.phone,
		email: self.currProfile.email,
		dia: self.currProfile.day,
		mes: self.currProfile.month,
		anyo: self.currProfile.year,

		/* 'Useless' ticket data */
		dia2: d.getDate(),
		mes2: d.getMonth() + 1,
		anyo2: d.getFullYear(),
		
		/* Área del problema */
		area: Defaults.AytoArea,

		/* Causa del problema */
		origen: Defaults.AytoCause
	};

	var formData = this._getFormData($('#ticket form'));
	ticketData['problema'] = formData['problem'];
	ticketData['numero'] = self.marker_invGeoLocation.address_components[0].short_name;
	ticketData['calle'] = self.marker_invGeoLocation.address_components[1].short_name;

	$('#ticket #url').text(Defaults.AytoAPI);
	$('#ticket #data').text(JSON.stringify(ticketData, null, '\t'));
	$('#ticket .messages#debug').show();


	self.runAytoRequest(ticketData, {simulated: true});
}

/*
 * Phase 3: Wait for response
 * This can be a simple spinner
 */
App.prototype.runAytoRequest = function(ticketData, opts) {
	var self = this;
	var simulated = opts.simulated || true;

	function simulatedApiCall() {
		setTimeout(function () {
			self.runAytoResponse({}, 'success');
		}, 3000);
	}

	function realApiCall() {
		$.ajax({
			type: "POST",
			url: url,
			data: ticketData,
	     	success: function (response) {
				self.runAytoResponse({}, 'success');
	     	},
	     	error: function (response) {
				self.runAytoResponse({}, 'error');
	     	},
    	});
	}

	self.switchToPanel('ayto-request');

	var url = Defaults.AytoAPI;
	var payload = $.param(ticketData);
	console.log(ticketData);	
	console.log(url+'?'+payload);

	$('#ayto-request #url').text(url);
	$('#ayto-request #data').text(JSON.stringify(ticketData, null, '\t'));
	$('#ayto-request #curl-command-line').text(
		'curl '+
		'--data "' + $.param(ticketData) + '" ' +
		'--referer "' + url + '" ' +
		'"' + url + '"'
	);

	var apiCall = simulated ? simulatedApiCall : realApiCall;
	apiCall(ticketData);
}

/*
 * Phase 4: Show server (Ayto) response
 * Just display some raw data
 */
App.prototype.runAytoResponse = function(response, status) {
	var self = this;

	self.switchToPanel('ayto-response');
	$('#ayto-response #status').text(status);
	$('#ayto-response #data').text(JSON.stringify(response));
}


/*
 * Support methods
 */
 App.prototype._getForm = function (f) {
	return f.serializeArray().reduce(function(obj, item) {
    	obj[item.name] = item;
    	return obj;
	}, {});
};

App.prototype._getFormData = function (f) {
	return f.serializeArray().reduce(function(obj, item) {
    	obj[item.name] = item.value;
    	return obj;
	}, {});
};
