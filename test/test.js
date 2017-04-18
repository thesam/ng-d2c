var d2c = require("../index.js");
var assert = require("assert");

describe("ng-d2c", function () {
    it("should not touch existing component", () => {
        assert.equal(d2c.convertString('angular.module("foo").component("bar",{})').code, 'angular.module("foo").component("bar",{})');
    });

    it("should convert empty directive", () => {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () { return {}; })').code, 'angular.module("foo").component("bar",{})');
    });

    it("should convert empty isolate scope to empty bindings", () => {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'scope: {}' +
            '};' +
            '});').code, 'angular.module("foo").component("bar",{\n  bindings: {}\n});');
    });

    it("should return error for directive with unsupported property", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'compile: {}' +
            '};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
    });

    //TODO: Convert file
    //TODO: restrict == E
    //TODO: Scan files, list directives that can be converted and those with errors
});
