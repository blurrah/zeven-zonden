// Backbone backend voor Mobile Interaction applicatie

"use strict";

// Op dit moment voor het debuggen maken we gebruik van een jquery load dinges
    
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
    
    // De header
    directory.views.header = Backbone.View.extend({
        initialize: function() {
            _.bindAll(this, 'render');
            
            this.template = _.template(directory.utils.templateLoader.get('header'));
            
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
    
    directory.utils.templateLoader.load(['start-page', 'locatie-page', 'reis-page'],
        function() {
            directory.app = new directory.Router();
            Backbone.history.start();
    });