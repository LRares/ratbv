// Ionic Starter App
var db = null;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('ratb', ['ionic', 'ngCordova', 'ratb.controllers', 'ratb.services', 'jett.ionic.filter.bar', 'ionic-timepicker', 'ionic-datepicker'])
  .config(function($ionicFilterBarConfigProvider) {
    $ionicFilterBarConfigProvider.clear('ion-ios-close-empty');
    $ionicFilterBarConfigProvider.placeholder("Search");
  })
  .config(function(ionicTimePickerProvider) {
    var timePickerObj = {
      inputTime: (((new Date()).getHours() * 60 * 60) + ((new Date()).getMinutes() * 60)),
      format: 24,
      step: 1,
      setLabel: 'Set',
      closeLabel: 'Close'
    };
    ionicTimePickerProvider.configTimePicker(timePickerObj);
  })
  .config(function(ionicDatePickerProvider) {
    var datePickerObj = {
      inputDate: new Date(),
      setLabel: 'Adauga ab',
      todayLabel: 'Astazi',
      closeLabel: 'Inchide',
      mondayFirst: false,
      weeksList: ["D", "L", "M", "Mi", "J", "V", "S"],
      monthsList: ["Ian", "Feb", "Martie", "Aprilie", "Mai", "Iunie", "Iulie", "Aug", "Sept", "Oct", "Nov", "Dec"],
      templateType: 'popup',
      //from: new Date(2012, 8, 1),
      //  to: new Date(2018, 8, 1),
      showTodayButton: true,
      dateFormat: 'dd MMMM yyyy',
      closeOnSelect: false,
      //disableWeekdays: [6]
    };
    ionicDatePickerProvider.configDatePicker(datePickerObj);
  })
  .run(function($ionicPlatform, $rootScope, $ionicLoading, $cordovaSQLite) {
    $ionicPlatform.ready(function() {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      if (window.cordova && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        cordova.plugins.Keyboard.disableScroll(true);

      }
      if (window.StatusBar) {
        // org.apache.cordova.statusbar required
        StatusBar.styleDefault();
      }

      /*$cordovaSQLite.deleteDB({
        name: "publicmobile.db",
        location: "default"
      }); */
      db = $cordovaSQLite.openDB({
        name: "publicmobile.db",
        location: "default"
      });
      $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS bilete (id integer primary key,dataexpirare datetime)");
      $cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS abonamente (id integer primary key,datacreare datetime, dataexpirare datetime)");
      console.log("db created");
    });

    $rootScope.$on('loading:show', function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
      })
    });

    $rootScope.$on('loading:hide', function() {
      $ionicLoading.hide();
    });

    $rootScope.$on('$stateChangeStart', function() {
      console.log('Loading ...');
      $rootScope.$broadcast('loading:show');
    });

    $rootScope.$on('$stateChangeSuccess', function() {
      console.log('done');
      $rootScope.$broadcast('loading:hide');
    });
  })

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'templates/sidebar.html',
      controller: 'AppCtrl'
    })
    //home page
    .state('app.home', {
      url: '/home',
      views: {
        'mainContent': {
          templateUrl: 'templates/home.html',
          controller: 'HomeController',

        }
      }
    })
    //routes/:startingStation/:destinationStation
    .state('app.trasee', {
      url: '/trasee/:statieStart/:statieStop',
      views: {
        'mainContent': {
          templateUrl: 'templates/trasee.html',
          controller: 'TraseuController', //routeController
        }
      }
    })

  //stations
  .state('app.statii', {
    url: '/statii',
    views: {
      'mainContent': {
        templateUrl: 'templates/statii.html',
        controller: 'StatieController',
        resolve: {
          statii: ['statiiFactory', function(statiiFactory) {
            //gets all the stations
            return statiiFactory.getStatii().query();
          }]
        }

      }
    }
  })

  //busses which go through a station
  .state('app.ruteStatie', {
    url: '/ruteStatie/:statie',
    views: {
      'mainContent': {
        templateUrl: 'templates/ruteStatie.html',
        controller: 'RuteStatieController',
      }
    }
  })

  //busses
  .state('app.rute', {
    url: '/rute',
    views: {
      'mainContent': {
        templateUrl: 'templates/rute.html',
        controller: 'RuteController',
        resolve: {
          rute: ['ruteFactory', function(ruteFactory) {
            return ruteFactory.query();
          }]
        }
      }
    }
  })

  /*.state('app.bileteAndAbonamente', {
    url: '/bileteAndAbonamente',
    views: {
      'mainContent': {
        templateUrl: 'templates/bileteSiAbonamente.html',
        controller: 'BileteSiAbonamenteController',
      }
    }
  })*/

  //currentStation for a route
  .state('app.statieCurentaForRuta', {
      url: '/viewStatieForRuta/:id/:ruta/:statieCurenta/:timpsaptamana',
      views: {
        'mainContent': {
          templateUrl: 'templates/viewStatieForRuta.html',
          controller: 'StatiaCurentaController',
          resolve: {
            statieCurentaForRuta: ['$stateParams', 'statieFactory', function($stateParams, statieFactory) {
              return statieFactory.get({
                nrlinie: parseInt($stateParams.id, 10),
                ruta: $stateParams.ruta.trim(),
                statie: $stateParams.statieCurenta,
                timpsaptamana: $stateParams.timpsaptamana,
              });
            }]

          }
        }
      }
    })
    .state('app.about', {
      url: '/about',
      views: {
        'mainContent': {
          templateUrl: 'templates/about.html'
        }
      }
    })
    .state('app.help', {
      url: '/help',
      views: {
        'mainContent': {
          templateUrl: 'templates/help.html'
        }
      }
    })
    
    //view route
    .state('app.viewRuta', {
      url: '/rutaCurenta/:id/:traseu',
      views: {
        'mainContent': {
          templateUrl: 'templates/viewRuta.html',
          controller: 'RutaCurentaController',
          resolve: {
            rutaCurenta: ['$stateParams', 'routeFactory', function($stateParams, routeFactory) {
              return routeFactory.get({
                id: parseInt($stateParams.id, 10),
                traseu: $stateParams.traseu,
              });
            }]
          }
        }
      }
    })

  $urlRouterProvider.otherwise('/app/home');
});
