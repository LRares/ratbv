'use strict';

angular.module('ratb.services', ['ngResource'])
  .constant("baseURL", "http://localhost:58962/api/")
  //gets the busses
  .factory('routeFactory', ['$resource', 'baseURL', function($resource, baseURL) {

    //"linii" = busses, "traseu" = route
    return $resource(baseURL + "linii/:id/:traseu", null, {
      'update': {
        method: 'PUT'
      }
    });
  }])

//station factory
.factory('statieFactory', ['$resource', 'baseURL', function($resource, baseURL) {

  //gets the current station based on params . Check the documentation for more info
  return $resource(baseURL + "getStatieCurenta/:nrlinie/:ruta/:statie/:timpsaptamana", null, {
    'update': {
      method: 'PUT'
    }
  });

}])

//bus factory
.factory('ruteFactory', ['$resource', 'baseURL', function($resource, baseURL) {
  return $resource(baseURL + "rute", null, {
    'update': {
      method: 'PUT'
    }
  });

}])

//stations factory - returns all the stations
.factory('statiiFactory', ['$resource', 'baseURL', '$http', function($resource, baseURL, $http) {

  var factory = {};

  factory.getStatii = function() {
    return $resource(baseURL + "statii", null, {
      'update': {
        method: 'PUT'
      }
    });
  };

  return factory;
}])

//tickets and subscriptions factory --- WARNING!!! --- works only on emulator/device
.factory('bileteAndAbonamenteFactory', ['$cordovaSQLite', function($cordovaSQLite) {
  var factory = {};
  factory.insertBilet = function(date) {
    var newDate = new Date(date.getTime() + 50 * 60000);
    var query = "INSERT INTO bilete (dataexpirare) VALUES(?)";
    $cordovaSQLite.execute(db, query, [newDate]).then(function(response) {
        console.log("INSERT ID -> " + response.insertId);
      },
      function(err) {
        console.error(err.message);
      });
  }

  factory.insertAbonament = function(abonament) {
    var query = "INSERT INTO abonamente (datacreare,dataexpirare) VALUES(?,?)";
    $cordovaSQLite.execute(db, query, [abonament.datacreare, abonament.dataexpirare]).then(function(response) {
        console.log("INSERT ID -> " + response.insertId);
      },
      function(err) {
        console.error(err.message);
      });
  }

  factory.getBilete = function() {
    var query = "SELECT * FROM bilete";
    $cordovaSQLite.execute(db, query, []).then(function(response) {
      console.log(response.rows);
      console.log("dsadas" + response.rows.item(0).dataexpirare);
      return response.rows;
    })
  }

  factory.getBilete = function() {
    var query = "SELECT * FROM abonamente";
    $cordovaSQLite.execute(db, query, []).then(function(response) {
      console.log(response.rows);
      console.log("dsadas" + response.rows.item(0).dataexpirare);
      return response.rows;
    })
  }



  return factory;
}])

.factory('closestRoutesFactory', ['$resource', 'baseURL', '$http', function($resource, baseURL, $http) {
  var factory = {};
  factory.checkDuplicates = function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
      return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
  };
  factory.accentsTidy = function(s) {
    var r = s.toLowerCase();
    var non_asciis = {
      'a': '[àáâãäåăâ]',
      'ae': 'æ',
      'c': 'ç',
      'e': '[èéêë]',
      'i': '[ìíîï]',
      'n': 'ñ',
      'o': '[òóôõö]',
      'oe': 'œ',
      'u': '[ùúûűü]',
      'y': '[ýÿ]',
      't': '[ţ]',
      's': '[ş]',
      'î': '[î]',
    };
    for (var i in non_asciis) {
      r = r.replace(new RegExp(non_asciis[i], 'g'), i);
    }
    return r;
  };
  factory.getClosestRoutes = function(routes) {
    var routesString = routes.map(function(elem) {
      return elem.name;
    }).join(",");
    var promise = $http({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      //lines/getLinesForStations - check documentation for more info!
      url: baseURL + "Linii/GetLiniiPentruStatii",
      params: {
        statii: routesString,
        isFromSearch: false,
      }
    }).then(function successCallback(response) {
      return response.data;
    });
    return promise
  };

  //used for station search
  factory.getClosestRoute = function(route) {
    var promise = $http({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      url: baseURL + "Linii/GetLiniiPentruStatii",
      params: {
        statii: route,
        isFromSearch: true,
      }
    }).then(function successCallback(response) {
      return response.data;
    });
    return promise;
  };


  //used to set a route between 2 stations
  factory.cautaTraseu = function(statieStart, statieStop) {
    var promise = $http({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      //lines/searchRoute
      url: baseURL + "Linii/CautaTraseu",
      params: {
        statieStart: statieStart,
        statieStop: statieStop,
      }
    }).then(function successCallback(response) {
      console.log(response.data);
      return response.data;
    });
    return promise;
  };
  //used to set a route between 2 stations
  factory.cautaTraseuComplex = function(statieStart, statieStop, complexSearch) {
    debugger;
    var promise = $http({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      url: baseURL + "linii/cautaTraseuComplex",
      params: {
        statieStart: statieStart,
        statieStop: statieStop,
      }
    }).then(function successCallback(response) {

      return response.data;
    });
    return promise;
  };

  return factory;

}]);
