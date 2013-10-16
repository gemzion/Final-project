$(function() {

    var app = {
        init: function() {
            this.user = {};
            $('.menu-crud').addClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.menu-loading').removeClass('hidden');
            $('.menu-user').addClass('hidden');
            $('.btn-login').addClass('hidden');

            $('.btn-login').attr('href', '/api/login?url=/');
            $('.btn-logout').attr('href','/api/logout?url=/');

            this.router = new Router();
            this.setEventListeners();
            this.getUser();

            Backbone.history.start({pushState: true});
        },

        setEventListeners: function() {
            var self = this;
            $('.menu-crud .item a').click(function(ev) {
                var $el = $(ev.target).closest('.item');

                $('.menu-crud .item').removeClass('active');
                $el.addClass("active");

                if ($el.hasClass('menu-list')) {
                    self.router.navigate('list', {trigger: true});
                }

                if ($el.hasClass('menu-create')) {
                    self.router.navigate('new', {trigger: true});
                }
            });

            $('.navbar-brand').click(function() {
                self.router.navigate('', {trigger: true});
            });

            $('.form-search').unbind('submit').submit(function(ev) {
                self.searchThesis($('.search-input').val());
                alert($('.search-input').val());
                return false;
            });
        },

        getUser: function() {
            var self = this;
            $.ajax({
                method: 'GET',
                url: '/api/users/me',
                success: function(me) {
                    // user is already signed in
                    console.log(me);
                    self.user = me;
                    self.showLogout();
                },

                error: function(err) {
                    console.log('you have not authenticated');
                    self.showLogin();
                }
            });
        },
        showLogin: function() {
           $('.menu-loading').addClass('hidden');
           $('.menu-user').addClass('hidden');
           $('.btn-login').removeClass('hidden');
        },
        showLogout: function() {
           $('.menu-crud').removeClass('hidden');
           $('.user-email').text(this.user.email);
           $('.menu-loading').addClass('hidden');
           $('.btn-login').addClass('hidden');
           $('.menu-user').removeClass('hidden');
        },
        showHome: function() {
            $('.app-content').html('');
        },
        showList: function() {
            var $listTemplate = getTemplate('tpl-thesis-list');
            $('.app-content').html($listTemplate);
            this.loadAllThesis();
        },
        search: function(query, callback) {
            $.get('/api/search/?q=' + query, {
                returned_fields: JSON.stringify(['Title', 'Year'])
            }, function(list) {
                callback(list);
            });
        },
        searchThesis: function(keyword){
            var self = this;
            var regex = new RegExp(".*(" + keyword + ").*", "i");
            $.get('/api/thesis', function(obj){
               var sorted_list = $.grep(obj, function(thesis, index){
                    return regex.test(thesis.Title);
               });
               if(sorted_list.length == 0){
                    alert('The thesis you are looking for is not existing in our database');
               }
               else{
                    var $listTemplate = getTemplate('tpl-thesis-list');
                    $('.app-content').html($listTemplate);
                    _.each(sorted_list, function(item) {
                        var $thesisItem = $(getTemplate('tpl-thesis-list-item', item));
                        $('.thesis-list').append($thesisItem);
                        var id = item.Id
                        if (item.Key) {
                            id = item.Key;
                        }
                        $thesisItem.find('.edit').click(function() {
                            self.router.navigate('edit-' + id, {trigger: true});
                        });
                        $thesisItem.find('.view').click(function() {
                            self.router.navigate('thesis-' + id, {trigger: true});
                        });
                        $thesisItem.find('.delete').click(function() {
                            self.router.navigate('delete-' + id, {trigger: true});
                        });
                    });
               }
               $('.search-input').val('');
            });
        },
         getThesisByID: function(id, callback) {
            var object = {};
            $.get('/api/thesis/' + id, function(item) {
                callback(item);
            });
        },
        showForm: function(object) {
            var thesisObject = {};
            if (!object) {
                object = {};
            }else{

                thesisObject.Id=object.Id;
            }
            var self = this;
            var $formTemplate = getTemplate('tpl-thesis-form', object);
            $('.app-content').html($formTemplate);


            $('#save-btn').click(function() {
                
                
                var inputs = $('form').serializeArray();
                for (var i = 0; i < inputs.length; i++) {
                    thesisObject[inputs[i].name] = inputs[i].value;
                }
                
                app.save(thesisObject);

                return false;
            });

        },
        showView: function(object){
            $('.app-content').html(getTemplate('tpl-view', object));
            fbcomments(document, 'script', 'facebook-jssdk');
        },
        loadAllThesis: function() {
            $.get('/api/thesis', this.displayLoadedList);
        },
        displayLoadedList: function(list) {
            console.log('response', list);
            //  use tpl-thesis-list-item to render each loaded list and attach it
			for (var i = 0; i < list.length; i++){
                $('.thesis-list').append(getTemplate('tpl-thesis-list-item', list[i]));
            }
            var funcbtn=0;
            $('.table tbody tr #edit-btn').click(function(event){
                funcbtn=1;
            });
            $('.table tbody tr #del-btn').click(function(event){
                funcbtn=2;
            });
        $('.table tbody tr').click(function(event){
            alert(funcbtn);
            if(funcbtn==1)
            {
                app.router.navigate('edit-' + $(this).attr('data-id'), {trigger: true});
                
                funcbtn=0;

            }else if(funcbtn==2){

                app.router.navigate('delete-' + $(this).attr('data-id'), {trigger: true});
                
                funcbtn=0;
            }else{
            app.router.navigate('thesis-' + $(this).attr('data-id'), {trigger: true});
        }
        });


        },
        save: function(object) {
		      $.post('/api/thesis', object)
              app.router.navigate('list', {trigger: true});
        },
        deleteThesis: function(id){
            var self = this;
            $.ajax({

                type: 'DELETE',
                url: '/api/thesis/' + id,
                success: function() {
                    self.router.navigate('', {trigger: true});
                    self.router.navigate('list', {trigger: true});
                }
            });
        },

    };

    function getTemplate(template_id, context) {
        var template, $template, markup;
        template = $('#' + template_id);
        $template = Handlebars.compile(template.html());
        markup = $template(context);
        return markup;

    }


    var Router = Backbone.Router.extend({
        routes: {
            '': 'onHome',
            'search?=:query': 'onSearch',
            'thesis-:id': 'onView',
            'new': 'onCreate',
            'edit-:id': 'onEdit',
            'list': 'onList',
            'delete-:id':'onDelete'
        },

       onHome: function() {
            app.showHome();
       },
       onSearch: function(query) {
            app.showList();
            app.search(query, function(list) {
                app.displayLoadedList(list);
            });
       },

       onView: function(id) {
           console.log('thesis id', id);
           $.get('/api/thesis/' + id, app.showView);
       },

       onCreate: function() {
            app.showForm();
       },

       onEdit: function(id) {
        $.get('/api/thesis/' + id, app.showForm);
       },

       onList: function() {
            app.showList();
       },
       onDelete: function(id) {
            app.deleteThesis(id);
       },

    });
    function fbcomments(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=463015370481850";
                fjs.parentNode.insertBefore(js, fjs);
                }
    app.init();


});