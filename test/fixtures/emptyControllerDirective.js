angular.module("foo").directive("empty", function () {
    return {
        scope: {},
        bindToController: true,
        restrict: "E",
        controller: function() {}
    };
});
