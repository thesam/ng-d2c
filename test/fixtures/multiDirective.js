angular.module("foo").directive("multiOne", function () {
    return {
        scope: {},
        bindToController: true,
        restrict: "E"
    };
}).directive("multiTwo", function () {
    return {
        scope: {},
        bindToController: true,
        restrict: "E"
    };
});