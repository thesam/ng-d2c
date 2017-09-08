angular.module("foo").directive("nonEmpty", function () {
    return {
      scope: {
          data: "="
      },
      bindToController: true,
      restrict: "E",
      controller: function() {
          console.log(this.data);
      }
    };
});
