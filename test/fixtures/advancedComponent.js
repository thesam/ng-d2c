angular.module("foo").component("advanced", {
    bindings: {
        foo: "=",
        bar: "@"
    },

    transclude: true,
    template: '<div>Template {{myCtrl.foo}}</div>',
    controllerAs: "myCtrl",
    require: "^parent",

    controller: function(someService) {
        this.$onInit = function() {
            console.log("Hello");
        };
    }
});
