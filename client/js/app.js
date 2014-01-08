// Backbone backend voor Mobile Interaction applicatie
// Use strict betekent strict-modus. De browser blokkeert onveilige handelingen en bad practices, mooi om kritisch te blijven.
"use strict";

/*
Tijd om RequireJS te gebruiken.
Alle JS bestanden worden dan binnengehaald door RequireJS en kunnen we alle views, controllers, models
in andere bestanden stoppen en worden deze alleen opgeroept op het moment dat ze nodig zijn! :)
*/

require.config({
    baseUrl: "js/",
    paths: {
        jquery: 'lib/jquery.min',
        underscore: 'lib/underscore-min',
        backbone: 'lib/backbone-min',
        'backbone.localStorage': 'lib/backbone.localStorage-min',
        fastclick: 'lib/fastclick'
    },
    /* Backbone en Underscore bieden geen support voor RequireJS out of the box
    Dus ik geef via een "shim" aan welke object backbone op moet reageren
    */
    shim: {
        // Underscore draait los van alles dus geen dependencies
        underscore: {
            exports: "_"
        },
        // Bijvoorbeeld backbone is afhankelijk van _ en $ en reageert op Backbone
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        // bb.localstorage maakt gebruik van Backbone als dep, dus ook meteen js en _. Reageert ook op Backbone.
        'backbone.localStorage': {
            deps: ['backbone'],
            exports: 'Backbone'
        }
    }
});

// Require starten, hier geef ik aan welk object de library moet aanspreken ($ = jquery)
define(['jquery', 'underscore', 'backbone', 'fastclick'], function ($, _, Backbone, FastClick) {

    /* Dit gebruiken we als objecten om backbone te extenden
    View: directory.views.NAAMVANVIEW
    Model: directory.models.NAAMVANMODEL
    Collection: directory.models.NAAMVANCOLLECTION
    Router: directory.ROUTERNAAM

    Zo houden we overzicht op alle objecten die we gebruiken voor Backbone, geen random variabelen en shit */

    var directory = {
        models: {},
        views: {},
        utils: {}
    }

    // asynchronous templates laden (met dank aan ccoenraets.org)
    directory.utils.templateLoader = {
        templates: {},

        load: function (names, callback) {
            var deferreds = [],
                self = this;

            $.each(names, function (index, name) {
                deferreds.push($.get('tpl/' + name + '.html', function (data) {
                    self.templates[name] = data;
                }));
            });

            $.when.apply(null, deferreds).done(callback);
        },

        get: function (name) {
            return this.templates[name];
        }
    }

    // Een fout in de model fixen
    Backbone.sync = function (method, model, success, error) {
        success();
    }

    // Model voor het laden van Google Maps :))
    directory.models.maps = Backbone.Model.extend({
        // defaults aangeven
        defaults: {
            id: '',
            currentLatLng: {},
            mapOptions: {},
            map: {},
            position: {},
            zoom: 13,
            maxZoom: 16,
            minZoom: 12,
            directionsService: {},
            directionsDisplay: {},
            newLatLng: {},
            styles: [],
            styledMap: {}
        },
        initMap: function (position) {
            this.set('position', position);
            var currentLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            this.set('currentLatLng', currentLatLng);
            var mapOptions = {
                zoom: this.get('zoom'),
                minZoom: this.get('minZoom'),
                maxZoom: this.get('maxZoom'),
                center: currentLatLng,
                mapTypeControlOptions: {
                    mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
                },
                mapTypeControl: false
            };

            this.set('mapOptions', mapOptions);
            var styles = [{
                stylers: [{
                    hue: "#e1ded9"
                }, {
                    saturation: -20
                }]
            }, {
                featureType: "road",
                elementType: "geometry",
                stylers: [{
                    lightness: 100
                }, {
                    visibility: "simplified"
                }]
            }, {
                featureType: "road",
                elementType: "labels",
                stylers: [{
                    visibility: "off"
                }]
            }];

            this.set('styles', styles);
            var styledMap = new google.maps.StyledMapType(styles, {
                name: "Styled Map"
            });
            this.set('styledMap', styledMap);
        },

        updateMap: function (position) {
            this.set('position', position);
            var newLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            this.set('newLatLng', newLatLng);
            this.get('map').panTo(newLatLng);
            $('#nav-title').text('De navigatie wordt geladen..');


            // navigatie
            var directionsService = new google.maps.DirectionsService();
            var directionsDisplay = new google.maps.DirectionsRenderer({
                polylineOptions: {
                    strokeColor: '#db2845'
                }
            });
            directionsDisplay.setMap(this.get('map'));
            var request = {
                origin: this.get('newLatLng'),
                destination: this.get('currentLatLng'),
                travelMode: google.maps.DirectionsTravelMode.WALKING
            };

            directionsService.route(request, function (response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                    $('#nav-title').text('Volg de route naar het Groot Tuighuis. (' + response.routes[0].legs[0].distance.value + " M)");
                }
            });
            this.set('directionsService', directionsService);
            this.set('directionsDisplay', directionsDisplay);
        }
    });

    // Intro pagina
    directory.views.list = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('start-page'));
            this.render();
        },

        render: function (eventName) {
            var self = this;
            $(this.el).html(this.template);
        }
    });

    // Locatie pagina 
    directory.views.locatie = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('locatie-page'));
            this.render();
        },

        render: function () {
            var self = this;
            $(this.el).html(this.template);
        }
    });

    //  Intro pagina Groot Tuighuis
    directory.views.reis = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('reis-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // Route opzoeken pagina
    directory.views.route = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('route-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // Google Maps view (uitbreiding op de route opzoeken pagina)
    directory.views.routeMap = Backbone.View.extend({
        id: 'map-canvas',
        className: 'map_canvas',
        initialize: function () {
            this.model.set('map', new google.maps.Map(this.el, this.model.get('mapOptions')));
            this.model.get('map').mapTypes.set('map_style', this.model.get('styledMap'));
            this.model.get('map').setMapTypeId('map_style');

        },
        render: function () {
            $('#' + this.id).replaceWith(this.el);
            return this;
        }
    });

    // Groot tuighuis vraag pagina
    directory.views.vraag = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('vraag-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // Vraatzucht coupon pagina
    directory.views.coupon = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('coupon-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // Badges pagina
    directory.views.badges = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('badges-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // Score pagina
    directory.views.score = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('score-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // Info pagina
    directory.views.info = Backbone.View.extend({
        initialize: function () {
            _.bindAll(this, 'render');
            this.template = _.template(directory.utils.templateLoader.get('info-page'));
            this.render();
        },
        render: function () {
            $(this.el).html(this.template);
        }
    });

    // De applicatie router, deze doet eigenlijk bijna alles

    directory.Router = Backbone.Router.extend({
        routes: {
            "": "starten",
            "start": "starten",
            "locatie": "locatie",
            "reis-tuighuis": "reis",
            "route-tuighuis": "routens",
            "vraag-tuighuis": "vraag",
            "coupon-tuighuis": "coupon",
            "badges": "badges",
            "score": "score",
            "info": "info"
        },

        initialize: function () {
            var self = this;

            // De geschiedenis van de pagina's om bij te houden of je naar voren of achter moet sliden
            this.pageHistory = [];

            this.startPage = new directory.views.list();
            //this.startPage.render();
            $(this.startPage.el).attr('id', 'startPage');

            $('header').on('click', '#backLink', function (event) {
                window.history.back();
                return false;
            });


        },

        starten: function () {
            var self = this;
            this.slidePage(this.startPage);
            $('#backLink').hide();
            $('#menuLink').hide();
        },

        locatie: function () {
            var self = this;
            this.locatiePage = new directory.views.locatie();
            this.slidePage(this.locatiePage);
            $('#backLink').show();
            $('#menuLink').show();
        },

        reis: function () {
            var self = this;
            this.reisPage = new directory.views.reis();
            this.slidePage(this.reisPage);
            $('#backLink').show();
            $('#menuLink').show();
        },

        routens: function () {
            var self = this;
            this.routePage = new directory.views.route();
            var map = new directory.models.maps({
                zoom: 16,
                maxZoom: 21,
                minZoom: 1
            });
            map.initMap({
                coords: {
                    latitude: 51.687041,
                    longitude: 5.312929
                }
            });
            var mapView = new directory.views.routeMap({
                model: map
            });

            // positie updaten
            function geo_success(position) {
                map.updateMap({
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                });
            }

            function geo_error() {
                alert("Sorry, no position available.");
            }

            var geo_options = {
                enableHighAccuracy: true,
                maximumAge: 30000,
                timeout: 27000
            };

            var wpid = navigator.geolocation.watchPosition(geo_success, geo_error, geo_options);

            this.slidePage(this.routePage);
            mapView.render();
            $('#backLink').show();
            $('#menuLink').show();
        },

        vraag: function () {
            var self = this;
            this.vraagPage = new directory.views.vraag();
            this.slidePage(this.vraagPage);
            $('#backLink').hide();
            $('#menuLink').show();
            
        },

        coupon: function () {
            var self = this;
            this.couponPage = new directory.views.coupon();
            this.slidePage(this.couponPage);
            $('#backLink').hide();
            $('#menuLink').hide();
        },

        badges: function () {
            var self = this;
            this.badgesPage = new directory.views.badges();
            this.slidePage(this.badgesPage);
            if($('#vraagVideo').exists() === true) {
                $('#vraagVideo').get(0).pause();
            }
            $('#backLink').show();
            $('#menuLink').show();
        },

        score: function () {
            var self = this;
            this.scorePage = new directory.views.score();
            this.slidePage(this.scorePage);
            $('#backLink').show();
            $('#menuLink').show();
        },

        info: function () {
            var self = this;
            this.infoPage = new directory.views.info();
            this.slidePage(this.infoPage);
            $('#backLink').show();
            $('#menuLink').show();
        },

        slidePage: function (page) {

            var slideFrom,
                self = this;

            if (!this.currentPage) {
                $(page.el).attr('class', 'page stage-center');
                $('#content').append(page.el);
                this.pageHistory = [window.location.hash];
                this.currentPage = page;
                return;
            }

            $('.stage-right, .stage-left').not('#startPage').remove();

            if (page === this.startPage) {
                // Altijd terugsliden als je naar de startpagina gaat
                slideFrom = "left";
                $(page.el).attr('class', 'page stage-left');
                // Page history verschonen
                this.pageHistory = [window.location.hash];
            } else if (this.pageHistory.length > 1 && window.location.hash === this.pageHistory[this.pageHistory.length - 2]) {
                // Nieuwe pagina is zelfde als de vorige -> teruggaan
                slideFrom = "left";
                $(page.el).attr('class', 'page stage-left');
                this.pageHistory.pop();
            } else {
                // Naar voren transitie
                slideFrom = "right";
                $(page.el).attr('class', 'page stage-right');
                this.pageHistory.push(window.location.hash);
            }

            $('#content').append(page.el);
            closePopUpMenu();
            
            $('#deVideo').get(0).pause();

            // deze functie wacht tot de pagina volledig geladen is
            setTimeout(function () {
                // Huidige pagina wegsliden (de if kijkt welke kant hij vandaan moet sliden)
                $(self.currentPage.el).attr('class', 'page transition ' + (slideFrom === "right" ? 'stage-left' : 'stage-right'));
                // De nieuwe pagina naar binnen laten sliden
                $(page.el).attr('class', 'page stage-center transition');

                self.currentPage = page;
            });
        }
    });

    directory.utils.templateLoader.load(['start-page', 'locatie-page', 'reis-page', 'route-page', 'vraag-page', 'coupon-page', 'badges-page', 'info-page'],
        function () {
            directory.app = new directory.Router();
            Backbone.history.start();
        });
    /* Custom JavaScript code */
    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {
        setTimeout(function () {
            navigator.splashscreen.hide();
        }, 2000);
        initialize();
    }

    $('#menuLink').on('click', openPopUpMenu);
    $('#content').on('click', closePopUpMenu);

    function openPopUpMenu() {
        var position = $('#popupMenu').css("top");
        position = parseInt(position);
        if (position < 0) {
            $('#popupMenu').css("top", "64px");
            $("video").prop("controls", false);
        } else {
            $('#popupMenu').css("top", "");
            $("video").prop("controls", true);
        }
    };

    function closePopUpMenu() {
        $('#popupMenu').css("top", "");
        $("video").prop("controls", true);
    };
    
    $.fn.exists = function () {
    return this.length !== 0;
}
    

    FastClick.attach(document.body);
});