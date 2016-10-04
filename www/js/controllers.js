angular.module('ratb.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
})


.controller('HomeController', ['$scope', '$stateParams', 'routeFactory', 'closestRoutesFactory', '$ionicLoading', '$cordovaGeolocation', '$ionicPlatform', '$timeout', '$ionicFilterBar', '$ionicModal',

  function($scope, $stateParams, routeFactory, closestRoutesFactory, $ionicLoading, $cordovaGeolocation, $ionicPlatform, $timeout, $ionicFilterBar, $ionicModal) {
    $scope.traseu = {};

    $ionicModal.fromTemplateUrl('templates/setTraseu.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.traseuForm = modal;
    });

    $scope.showSearchView = function() {
      $scope.traseuForm.show();
    };

    $scope.closeTraseu = function() {
      $scope.traseuForm.hide();
    };

    $scope.cautaTraseu = function() {
      window.location.href = '#/app/trasee/' + $scope.traseu.statieStart + '/' + $scope.traseu.statieDest;
      $timeout(function() {
        $scope.closeTraseu();
      }, 1000);
    };

    routeFactory.query(function(response) {
      $scope.rute = response;
      getStatiiByLocation();
    }); //end query

    //this function gets the stations based on the user's proximity
    function getStatiiByLocation() {
      $ionicPlatform.ready(function() {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring location!'
        });

        var posOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000
        };

        $cordovaGeolocation.getCurrentPosition(posOptions).then(function(position) {
            console.log("Raspuns");
            $scope.closestRoutes = [];
            var lat = position.coords.latitude;
            var long = position.coords.longitude;

            var myLatlng = new google.maps.LatLng(lat, long);

            var mapOptions = {
              center: myLatlng,
              zoom: 16,
              mapTypeId: google.maps.MapTypeId.ROADMAP
            };

            var map = new google.maps.Map(document.getElementById("map"), mapOptions);

            $scope.map = map;
            console.log("lat" + $scope.map.center.lat());
            console.log("long" + $scope.map.center.lng());
            infowindow = new google.maps.InfoWindow();
            var service = new google.maps.places.PlacesService($scope.map);
            service.nearbySearch({
              location: {
                //hardoding lat and lng params in other to demonstrate the geolocation
                "lat": 45.644909, //$scope.map.center.lat(),
                "lng": 25.623016 //$scope.map.center.lng() //
              },
              radius: 300, //160,
              type: ['bus_station']
            }, callback);

            function callback(results, status) {
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                closestRoutesFactory.getClosestRoutes(results).then(function(response) {
                  console.log("Raspuns" + response);
                  $scope.closestRoutes = response;

                })
              }
            };
            $ionicLoading.hide();
          },
          function(err) {
            $ionicLoading.hide();
            console.log(err.code + err.message);
          });
      });

    };

    $scope.showFilterBar = function() {
      var filterBarInstance = $ionicFilterBar.show({
        cancelText: "<i class='ion-ios-close-outline'></i>",
        items: $scope.closestRoutes,
        update: function(filteredItems, filterText) {
          debugger;
          if (filterText == null || filterText == "") {
            if ($scope.closestRoutes.length == 0) {
              getStatiiByLocation();
            }
          } else {
            closestRoutesFactory.getClosestRoute(filterText).then(function(response) {
              $scope.closestRoutes = response;
              console.log("close" + response);
              debugger;
            })
          }
        }
      });
    };

  }
])

//controller user for the routes
.controller('TraseuController', ['$scope', '$stateParams', 'closestRoutesFactory',
  function($scope, $stateParams, closestRoutesFactory) {
    $scope.trasee = [];
    //if a simple route is found  (no neeed to change busses to get from starting station to a destination station) this will be set to true
    $scope.foundeasy = true;
    //if a complex route is found  ( neeed to change busses to get from starting station to a destination station) this will be set to true
    $scope.foundhard = true;
    //mesajEroare = errorMessage
    $scope.mesajEroare = "";
    //searching for routes from the startingStation("statieStart") to destinationStation("statieStop")
    closestRoutesFactory.cautaTraseu($stateParams.statieStart, $stateParams.statieStop).then(function(response) {
      if (response.length >= 1) {
        //set the scope results with the response
        $scope.trasee = response;
        console.log(response);
        $scope.foundeasy = false;
        $scope.foundhard = true;
        //We use the same errorMessage variable to notify the user if there are routes found:
        $scope.mesajEroare = "Routes found between: " + $stateParams.statieStart + " and " + $stateParams.statieStop + " are:";
      } else if (response.length == undefined) {
        for (var t in response) {
          $scope.trasee.push(response[t]);
        }
        $scope.mesajEroare = "Routes found between: " + $stateParams.statieStart + " and " + $stateParams.statieStop + "are:";
        $scope.foundeasy = true;
        $scope.foundhard = false;
      }

    });
  }
])

//this controller is used for tickets and subscriptions - WARNING!!!! works only on emulator/phone
.controller('BileteSiAbonamenteController', ['$scope', '$stateParams', 'bileteAndAbonamenteFactory', '$cordovaSQLite', '$ionicModal', 'ionicTimePicker', 'ionicDatePicker', '$timeout',
  function($scope, $stateParams, bileteAndAbonamenteFactory, $cordovaSQLite, $ionicModal, ionicTimePicker, ionicDatePicker, $timeout) {
    $scope.bilete = [];
    getBilete();
    $scope.tipuriAbonamente = [{
      name: "monthly, all lines",
      checked: false
    }, {
      name: "monthly, line 20", //line 20 has a special ticket
      checked: false
    }, {
      name: "monthly, all lines, including line 20",
      checked: false
    }];

    $scope.switchClass = function(item) {
      var currentDate = new Date();
      var dateFromDb = item.dataexpirare;
      var diff = dateFromDb - currentDate;
      var msec = diff;
      var hh = Math.floor(msec / 1000 / 60 / 60);
      msec -= hh * 1000 * 60 * 60;
      var mm = Math.floor(msec / 1000 / 60);
      if (currentDate > dateFromDb)
        return "item-text-wrap item-button-right redText";
      else if (mm <= 5)
        return "item-text-wrap item-button-right orangeText";
      else return "item-text-wrap item-button-right blackText";
    }

    $scope.updateSelection = function(position, itens, title) {
      angular.forEach(itens, function(subscription, index) {
        if (position != index) {
          subscription.checked = false;
        }
        $scope.selected = title;
      });
    }
    $scope.abonament = {};


    //adds a ticket to the database ("addBilet" = addTicket)
    $scope.addBilet = function() {
      var ipObj1 = {
        callback: function(val) { //Mandatory
          if (typeof(val) === 'undefined') {
            console.log('Time not selected');
          } else {
            var selectedTime = new Date(val * 1000);
            var d = new Date();
            var dt = new Date(d.getFullYear(), d.getMonth(), d.getUTCDate(), selectedTime.getUTCHours(), selectedTime.getUTCMinutes(), d.getSeconds(), d.getMilliseconds());
            bileteAndAbonamenteFactory.insertBilet(dt);
            $timeout(function() {
              $scope.bilete = [];
              getBilete();
              console.log("tm length " + $scope.bilete.length);
            }, 1000);

            var interval = setInterval(function() {
              updateScopeEveryMinute();
            }, 60000);

          }
        },
        inputTime: ((((new Date()).getHours() - 1) * 60 * 60) + ((new Date()).getMinutes() * 60)), //Optional
        format: 24, //Optional
        step: 1, //Optional
        setLabel: 'Adauga bilet' //Optional
      };
      ionicTimePicker.openTimePicker(ipObj1);
    };
    //delets a ticket from the database ("stergeBilet" = deleteTicket)
    $scope.stergeBilet = function(id) {
        var query = "DELETE FROM bilete where id = ? ";
        $cordovaSQLite.execute(db, query, [id]).then(function(response) {
          console.log(response);
          console.log(id);
          getBilete();
        });
      }
      //gets all the tickets for the user ("getBilete" = getTickets)
    function getBilete() {
      $scope.bilete = [];
      var query = "SELECT * FROM bilete";
      $cordovaSQLite.execute(db, query, []).then(function(response) {
        for (var i = 0; i < response.rows.length; i++) {
          var currentDate = new Date();
          var dateFromDb = new Date(response.rows.item(i).dataexpirare);
          var diff = dateFromDb - currentDate;
          var msec = diff;
          var hh = Math.floor(msec / 1000 / 60 / 60);
          msec -= hh * 1000 * 60 * 60;
          var mm = Math.floor(msec / 1000 / 60);
          var itm = {
            id: response.rows.item(i).id,
            dataexpirare: dateFromDb,

          };
          if (currentDate > dateFromDb) {
            itm.descriere = "Ticket no. " + (i + 1) + " expired at  " + dateFromDb.getHours() + ":" + dateFromDb.getMinutes()

          } else {
            itm.descriere = "Ticket no. " + (i + 1) + " expires in " + mm + " minutes, at " + dateFromDb.getHours() + ":" + dateFromDb.getMinutes()

          }
          $scope.bilete.push(itm);
        }
      })
    }


    function updateScopeEveryMinute() {
      if ($scope.bilete.length > 0) {
        $scope.bilete = [];
        getBilete();

      }
    }

    $ionicModal.fromTemplateUrl('templates/addAbonament.html', {
      scope: $scope
    }).then(function(modal) {
      $scope.abonamentForm = modal;
    });

    $scope.closeAbonament = function() {
      $scope.abonamentForm.hide();
    };

    $scope.showAbForm = function() {
      $scope.abonamentForm.show();
    };
    $scope.abonamente = [];
    getAbonamente();
    //adds a monthly subscription ("addAbonament" = addSubscription. "abonament" = subscription)
    $scope.addAbonament = function() {
      var dt = new Date($scope.abonament.date);
      dt.setDate(dt.getDate() + 29);
      var ab = {
        datacreare: new Date($scope.abonament.date),
        dataexpirare: dt
      };
      bileteAndAbonamenteFactory.insertAbonament(ab);
      $timeout(function() {
        $scope.abonamente = [];
        getAbonamente();
      }, 1000);
      // Simulate a reservation delay. Remove this and replace with your reservation
      // code if using a server system
      $timeout(function() {
        $scope.closeAbonament();
      }, 1000);
    };


    //gets all the subscriptions
    function getAbonamente() {
      var query = "SELECT * FROM abonamente";
      $scope.abonamente = [];
      $cordovaSQLite.execute(db, query, []).then(function(response) {
        console.log(response.rows);
        for (var i = 0; i < response.rows.length; i++) {
          var dataExpirare = new Date(response.rows.item(i).dataexpirare);
          var daysUntilExpire = Math.floor((dataExpirare - new Date()) / 86400000);
          var itm = {
            id: response.rows.item(i).id,
            dataexpirare: dataExpirare
          };

          if (daysUntilExpire < 0) {
            itm.descriere = "Subscription no. " + (i + 1) + "expired at " + dataExpirare.getDate() + "/" + (dataExpirare.getMonth() + 1) + "/" + dataExpirare.getFullYear();
          } else {

            itm.descriere = "Subscription no. " + (i + 1) + " expires in " + (daysUntilExpire + 1) + " zile la " + dataExpirare.getDate() + "/" + (dataExpirare.getMonth() + 1) + "/" + dataExpirare.getFullYear();
          }
          $scope.abonamente.push(itm);
        }
      })
    }

    $scope.switchClassAbonament = function(item) {
        var daysUntilExpire = Math.floor((item.dataexpirare - new Date()) / 86400000) + 1;
        if (daysUntilExpire < 0)
          return "item-text-wrap item-button-right redText";
        else if (daysUntilExpire <= 5 && daysUntilExpire > 0)
          return "item-text-wrap item-button-right orangeText";
        else return "item-text-wrap item-button-right blackText";
      }
      //deletes a subscription from the database
    $scope.stergeAbonament = function(id) {
      var query = "DELETE FROM abonamente where id = ? ";
      $cordovaSQLite.execute(db, query, [id]).then(function(response) {
        console.log(response);
        console.log(id);
        getAbonamente();
      });
    }
  }
])


//busses controller ("Rute" = busses)
.controller('RuteController', ['$scope', '$stateParams', 'rute', '$ionicFilterBar', '$ionicPlatform', '$ionicLoading',
  function($scope, $stateParams, rute, $ionicFilterBar, $ionicPlatform, $ionicLoading) {
    $ionicPlatform.ready(function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
      });
      rute.$promise.then(function(response) {
        $scope.rute = response;
      }).finally(function() {
        $ionicLoading.hide();
      });
    })

    //clicking on a bus calls this method
    $scope.gotoRuta = function(ruta) {
      var ruta = ruta.split("=>");
      window.location.href = '#/app/rutaCurenta/' + ruta[0] + "/dus";
    };

    $scope.showFilterBar = function() {
      var filterBarInstance = $ionicFilterBar.show({
        cancelText: "<i class='ion-ios-close-outline'></i>",
        items: $scope.rute,
        update: function(filteredItems, filterText) {
          if (filterText == null || filterText == "") {
            $scope.rute = rute;
          } else {
            var ruteGasite = [];
            for (i = 0; i < rute.length; i++) {
              if (rute[i].toLowerCase().indexOf(filterText.toLowerCase()) > -1) {
                ruteGasite.push(rute[i]);
              }
            }
            $scope.rute = ruteGasite;
          }
        }
      });
    };
  }
])

//current buss controller ("Ruta curenta" = current bus)
.controller('RutaCurentaController', ['$scope', '$stateParams', 'rutaCurenta', 'routeFactory', '$ionicPlatform', '$ionicLoading',
  function($scope, $stateParams, rutaCurenta, routeFactory, $ionicPlatform, $ionicLoading) {
    //  $scope.rutaCurenta = rutaCurenta;
    $ionicPlatform.ready(function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
      });
      rutaCurenta.$promise.then(function(response) {
        $scope.rutaCurenta = response;

      }).finally(function() {
        $ionicLoading.hide();
      });
    })

    //switches from one route to the oposite one. For example bus no.1 goes from station X to station Y. Calling this method will show the route from station Y to station X.
    $scope.swapRuta = function(ruta) {
      var traseuCurent = ruta.Statii[0].Traseu;
      if (traseuCurent.indexOf("dus") > -1) {
        //"intors" = the route from Y to X
        switchTraseu(ruta.NrLinie, "intors");
      } else {
        //"dus" = the route from X to Y
        switchTraseu(ruta.NrLinie, "dus");

      }

    };

    function switchTraseu(nrLinie, traseu) {
      $ionicPlatform.ready(function() {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
        });
        routeFactory.get({
          id: parseInt(nrLinie, 10),
          traseu: traseu,
        }).$promise.then(function(response) {
          $scope.rutaCurenta = response;
        }).finally(function() {
          $ionicLoading.hide();
        });

      });

    }
  }
])

//station controller ("statie" = station)
.controller('StatieController', ['$scope', '$stateParams', 'statii', 'closestRoutesFactory', '$ionicFilterBar', '$ionicPlatform', '$ionicLoading',
  function($scope, $stateParams, statii, closestRoutesFactory, $ionicFilterBar, $ionicPlatform, $ionicLoading) {
    $ionicPlatform.ready(function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
      });
      statii.$promise.then(function(response) {
        $scope.statii = response;

      }).finally(function() {
        $ionicLoading.hide();
      });
    })

    $scope.showFilterBar = function() {
      var filterBarInstance = $ionicFilterBar.show({
        cancelText: "<i class='ion-ios-close-outline'></i>",
        items: $scope.statii,
        update: function(filteredItems, filterText) {
          if (filterText == null || filterText == "") {
            $scope.statii = statii;
          } else {
            var statiiGasite = [];
            for (i = 0; i < statii.length; i++) {
              if (statii[i].toLowerCase().indexOf(filterText.toLowerCase()) > -1) {
                statiiGasite.push(statii[i]);
              }
            }
            $scope.statii = statiiGasite;
          }
        }
      });
    };

  }
])

//bus stations controller ("RuteStatie" = bus stations)
.controller('RuteStatieController', ['$scope', '$stateParams', 'closestRoutesFactory', '$ionicPlatform', '$ionicLoading',
  function($scope, $stateParams, closestRoutesFactory, $ionicPlatform, $ionicLoading) {

    $ionicPlatform.ready(function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
      });
      closestRoutesFactory.getClosestRoute($stateParams.statie).then(function(response) {
        $scope.rute = response;
      }).finally(function() {
        $ionicLoading.hide();
      })
    });
  }
])

//current station for bus controller
.controller('StatiaCurentaController', ['$scope', '$stateParams', 'statieCurentaForRuta', '$ionicPlatform', '$ionicLoading', 'statieFactory',
  function($scope, $stateParams, statieCurentaForRuta, $ionicPlatform, $ionicLoading, statieFactory) {
    $ionicPlatform.ready(function() {
      $ionicLoading.show({
        template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
      });
      statieCurentaForRuta.$promise.then(function(response) {
        $scope.statieCurentaForRuta = response;

      }).finally(function() {
        $ionicLoading.hide();
      });
    })

    //switches between days of week.
    $scope.tab = 1;
    $scope.select = function(setTab) {
      $scope.tab = setTab;
      if (setTab === 1) {
        //"luni-vineri" = monday - friday
        getInvervalForStatie("luni-vineri");
      } else if (setTab === 2) {
        //"sambata" = saturday
        getInvervalForStatie("sambata");
      } else if (setTab === 3) {
        //"duminica" = sunday
        getInvervalForStatie("duminica");
      }
    };

    //gets the station timetable 
    function getInvervalForStatie(interval) {
      $ionicPlatform.ready(function() {
        $ionicLoading.show({
          template: '<ion-spinner icon="bubbles"></ion-spinner><br/>Acquiring data!'
        });
        statieFactory.get({
          nrlinie: statieCurentaForRuta.NrLinie,
          ruta: statieCurentaForRuta.Ruta.trim(),
          statie: statieCurentaForRuta.Statii[0].NumeStatie.trim(),
          timpsaptamana: interval
        }).$promise.then(function(response) {
          $scope.statieCurentaForRuta = response;
        }).finally(function() {
          $ionicLoading.hide();
        });


      });
    }


    $scope.isSelected = function(checkTab) {
      return ($scope.tab === checkTab);
    };

    $scope.setClassForMinut = function(minut) {
      if (minut.AltCapatLinie) {
        return "greySquare";
      } else
      if (minut.IsRedBus) {
        return "blueSquare";
      } else return "normalSquare";
    };



  }
])
