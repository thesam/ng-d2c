var d2c = require("../index.js");
var assert = require("assert");

describe("ng-d2c", function () {
    it("should not touch existing component", function () {
        assert.equal(d2c.convertString('angular.module("foo").component("bar",{})'), 'angular.module("foo").component("bar",{})');
    });

    it("should convert empty directive", function () {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {})'), 'angular.module("foo").component("bar",{})');
    });

    it("should convert empty isolate scope to empty bindings", function () {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'scope: {}' +
            '};' +
            '})'), 'angular.module("foo").component("bar",{bindings: {})');
    });

    //TODO: Change directive name
    //TODO: Convert file (and filename)
    //TODO: Scan files, list candidates
});
