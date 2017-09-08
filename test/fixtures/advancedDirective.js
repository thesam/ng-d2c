angular.module("foo").directive("advanced", function () {
    return {
        scope: {
        },
        bindToController: {
            foo: "=",
            bar: "@"
        },
        restrict: "E",
        transclude: true,
        template: '<div>Template {{myCtrl.foo}}</div>',
        controllerAs: "myCtrl",
        require: "^parent",
        controller: function(someService) {
            console.log("Hello");
        }
    };
});
