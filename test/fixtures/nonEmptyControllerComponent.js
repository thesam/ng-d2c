angular.module("foo").component("nonEmpty", {
    bindings: {
        data: "="
    },

    controller: function() {
        this.$onInit = function() {
            console.log(this.data);
        };
    }
});
