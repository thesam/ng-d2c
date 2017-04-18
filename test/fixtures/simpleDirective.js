angular.module("foo").directive("simple", function () {
    return {
        scope: {},
        bindToController: true,
        restrict: "E"
    };
});