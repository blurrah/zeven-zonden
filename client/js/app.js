// Backbone backend voor Mobile Interaction applicatie

/* Todo list
- Overige pagina's toevoegen
- Data van gebruiker opslaan in localStorage
- Views, Controllers, Models gaan scheiden van hoofd JS bestand
- Grunt installeren (task runner om alles te compressen en shit)

*/

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
define(['jquery', 'underscore', 'backbone', 'fastclick'], function($, _, Backbone, FastClick) {
    



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
    
    // asynchronous templates laden
    directory.utils.templateLoader = {
        templates: {},
        
        load: function(names, callback) {
            var deferreds = [],
                self = this;
                
            $.each(names, function(index, name){
                deferreds.push($.get('tpl/' + name + '.html', function(data) {
                    self.templates[name] = data;
                }));
            });
            
        $.when.apply(null, deferreds).done(callback);
        },
        
        get: function(name) {
            return this.templates[name];
        }
    }
    
    // Een fout in de model fixen
    Backbone.sync = function(method, model, success, error){
        success();
    }
    
   
   // Locatie pagina 
    directory.views.locatie = Backbone.View.extend({
       initialize: function() {
           _.bindAll(this, 'render');
           
           this.template = _.template(directory.utils.templateLoader.get('locatie-page'));
           
           this.render();
       },
       
       render: function() {
           var self = this;
           $(this.el).html(this.template);
       }
    });
    

    // Algemene view van de pagina
    directory.views.list = Backbone.View.extend({
        
        initialize: function(){
            _.bindAll(this, 'render');
            
            this.template = _.template(directory.utils.templateLoader.get('start-page'));
            
            this.render();
        },
        
        
        render: function(eventName) {
            var self = this;
            $(this.el).html(this.template);

        }
        
    });
    
    directory.views.reis = Backbone.View.extend({
       initialize: function(){
           _.bindAll(this, 'render');
           
           this.template = _.template(directory.utils.templateLoader.get('reis-page'));
           
           this.render();
           
       },
       
       render: function() {
           $(this.el).html(this.template);
       }
        
    });
    
    directory.views.route = Backbone.View.extend({
       
       initialize: function(){
           _.bindAll(this, 'render');
           
           this.template = _.template(directory.utils.templateLoader.get('route-page'));
           
           this.render();
       },
       
       render: function() {
           $(this.el).html(this.template);
       }
        
    });
    
    // De applicatie router, deze doet eigenlijk bijna alles
    
    directory.Router = Backbone.Router.extend({
        routes: {
            "": "starten",
            "start": "starten",
            "locatie": "locatie",
            "reis-tuighuis": "reis"
        },
        
        initialize: function() {
            
            var self = this;
            
            // De geschiedenis van de pagina's om bij te houden of je naar voren of achter moet sliden
            this.pageHistory = [];
            
            
            this.startPage = new directory.views.list();
            //this.startPage.render();
            $(this.startPage.el).attr('id', 'startPage');
            
            $('header').on('click', '#backLink', function(event){
                window.history.back();
                return false;
            });
            
            
        },
        
        starten: function(){
            var self = this;
            this.slidePage(this.startPage);
            
        },
        
        locatie: function() {
            var self = this;
            this.locatiePage = new directory.views.locatie();
            this.slidePage(this.locatiePage);
        },
        
        stap1: function() {
            var self = this;
            this.stap1Page = new directory.views.stap1();
            this.slidePage(this.stap1Page);
        },
        
        reis: function() {
            var self = this;
            this.reisPage = new directory.views.reis();
            this.slidePage(this.reisPage);
        },
        
        slidePage: function(page) {
            
            var slideFrom,
            self = this;
            
            if(!this.currentPage) {
                $(page.el).attr('class', 'page stage-center');
                $('#content').append(page.el);
                this.pageHistory = [window.location.hash];
                this.currentPage = page;
                return;
            }
            
            $('.stage-right, .stage-left').not('#startPage').remove();
            console.log("Hai?");
            
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
            setTimeout(function() {
                    // Huidige pagina wegsliden (de if kijkt welke kant hij vandaan moet sliden)
                    $(self.currentPage.el).attr('class', 'page transition ' + (slideFrom === "right" ? 'stage-left' : 'stage-right'));
                    // De nieuwe pagina naar binnen laten sliden
                    $(page.el).attr('class', 'page stage-center transition');
                    
                    self.currentPage = page;
            });
        }
    });
    
    directory.utils.templateLoader.load(['start-page', 'locatie-page', 'reis-page', 'route-page'],
        function() {
            directory.app = new directory.Router();
            Backbone.history.start();
    });
    
    $('#menuLink').on('click', openPopUpMenu);
    $('#content').on('click', closePopUpMenu);
    
    function openPopUpMenu(){
        var position = $('#popupMenu').css( "top" );
        position = parseInt(position);
        if(position < 0){
            $('#popupMenu').css( "top", "64px" );
        }else{
            $('#popupMenu').css( "top", "" );
        }
    };
    
    function closePopUpMenu(){
        $('#popupMenu').css( "top", "" );
    };
    
    FastClick.attach(document.body);
});