"use strict";

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

	// Map stuff
	self.marker = undefined;
	self.map = undefined;
	self.marker_address = {};

	// Show / hide elements
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

App.prototype.switchToPanel = function (panel) {
	var panels = ['about', 'profile-setup', 'ticket', 'waiting', 'upstream-response'];
	$.each(panels, function(idx, e) {
		var id = '.smc-panel#' + e;

		if (e == panel) {
			$(id).show();
		}
		else {
			$(id).hide();
		}
	});
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

App.prototype.initMap = function () {
	var self = this;

	function onClick (e) {
		self.setMarker({
			latitude: e.latLng.lat(),
			longitude: e.latLng.lng()
		});
		e.stop();
	}

	this.map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 39.9859896, lng: -0.043105240},
    	zoom: 15
	});

	this.map.addListener('click', onClick);
}

App.prototype.setMarker = function (coords) {
	var self = this;

	function tryGeoposition() {
		navigator.geolocation.getCurrentPosition(onGeoposition);
	}

	function onGeoposition (geo) {
		self.setMarker({
			latitude: geo.coords.latitude,
			longitude: geo.coords.longitude
		});
	}

	if (coords === undefined) {
		tryGeoposition();
		return;
	}

	if (self.marker !== undefined) {
		self.marker.setMap(undefined);
	}

	self.marker = new google.maps.Marker({
		map: self.map,
		position: {
			lat: coords.latitude,
			lng: coords.longitude
		}
	});
	self.map.panTo({
		lat: coords.latitude,
		lng: coords.longitude
	});

	self.updateAddress();
}

App.prototype.updateAddress = function() {
	var self = this;

	function onResponse (resp) {
		self.marker_address = {
			number: resp.results[0].address_components[0].short_name,
			street: resp.results[0].address_components[1].short_name
		};

		var label = self.marker_address.street + ', ' + self.marker_address.number
		$('#ticket #map-address').val(label);

		console.log('Marker located at: ', label);
	};

	var q = 'https://maps.googleapis.com/maps/api/geocode/json?' +
	      'key=AIzaSyAbozrLWf95y2G6oz24ne3ONfaaOXhEVp0&' +
	      'language=es&' +
	      'latlng=' + self.marker.position.lat() + ',' + self.marker.position.lng();

	$.get(q, onResponse);
}

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

App.prototype.runTicket = function () {
	var self = this;
	this.switchToPanel('ticket');

	var label = "Current profile: " + this.currProfileName;
}

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
	Cookies.set('profiles', profiles);

	console.log("Saved profile '"+ profileName +"'");
	self._init();
};

App.prototype.onTicketSubmitted = function () {
	var self = this;

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
		mes2: d.getMonth(),
		anyo2: d.getFullYear(),
		
		/* Área del problema */
		area: 'Otras Áreas de Desperfecto.',

		/* Causa del problema */
		origen: 'Desconocido'
	};

	var formData = this._getFormData($('#ticket form'));
	ticketData['problema'] = formData['problem'];
	ticketData['numero'] = self.marker_address.number;
	ticketData['calle'] = self.marker_address.street;

	$('#ticket #url').text(url);
	$('#ticket #data').text(JSON.stringify(ticketData, null, '\t'));
	$('#ticket .messages#debug').show();

	/*
	var url = 'http://castello.es/web30/pages/generico_web10.php?cod1=383&cod2=615';
	var payload = $.param(ticketData);
	console.log(ticketData);	
	console.log(url+'?'+payload);
	*/
	return;

	promise = $.ajax({
		type: "POST",
		url: url,
		data: ticketData,
     	success: function (response) {
     		self.onTicketSubmitResponse(response, 'success');
     	},
     	error: function (response) {
     		self.onTicketSubmitResponse(response, 'error');
     	},
    });

	self.waitForAytoResponse();
}

App.prototype.waitForAytoResponse = function() {

}

App.prototype.onTicketSubmitResponse = function (response, status) {
	var self = this;

	$('#profile-setup').hide();
	$('#ticket').hide();

	var html = '<strong>' + status + '<status>';
	$('#upstream-reply #status').html(label)

	$('#upstream-reply').show();
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

$(document).ready(function() {
	document.app = new App();
});

function initMap() {
	document.app.initMap();
}
