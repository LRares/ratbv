describe('HomeController', function() {
  var scope, $stateParams, $routeFactory, $closestRoutesFactory, $ionicLoading, $cordovaGeolocation, $ionicPlatform, $timeout;
  beforeEach(inject(function($rootScope, $controller, _$stateParams_, _$routeFactory_, _$closestRoutesFactory_, _$ionicLoading_, _$cordovaGeolocation_, _$ionicPlatform_, _$timeout_) {
      $stateParams = _$stateParams_;
      $routeFactory = _$routeFactory_;
      $closestRoutesFactory = _$closestRoutesFactory_;
      $ionicLoading = _$ionicLoading_;
      $cordovaGeolocation = _$cordovaGeolocation_;
      $ionicPlatform = _$ionicPlatform_;
      $timeout = _$timeout_;
      scope = $rootScope.$new();
      createController = function() {
        return $controller('HomeController', {
          '$scope': scope
        });
      });
  }; controller = $controller('HomeController', {
    '$scope': scope
  }));

  it("gets the routes from the server on the home page", function() {
    expect($scope.closestRoutes.length >= 1).toBeTruthy();
  });


});
