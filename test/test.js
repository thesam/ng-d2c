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

    function testUnsupportedProperty(propertyName) {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            propertyName + ': {}' +
            '};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Property cannot be converted safely: " + propertyName);
    }

    it("should return error for directive with unsupported property", () => {
        testUnsupportedProperty("compile");
        testUnsupportedProperty("link");
        testUnsupportedProperty("multiElement");
        testUnsupportedProperty("priority");
        testUnsupportedProperty("replace");
        testUnsupportedProperty("templateNamespace");
        testUnsupportedProperty("terminal");
        testUnsupportedProperty("randomName");
    });

    it("should return error for directive that does not return object", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return "";' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not return an object");
    });

    it("TODO: should copy supported properties to component object", () => {
        // let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
        //     'return {' +
        //     'compile: {}' +
        //     '};' +
        //     '});');
        // assert.equal(result.code, undefined);
        // assert.equal(result.errors.length, 1);
        // assert.equal(result.errors[0], "Property cannot be converted safely: compile");
    });

    //TODO: Convert file
    //TODO: restrict == E
    //TODO: Scan files, list directives that can be converted and those with errors
    //TODO: Different combos of scope/bindToController (separate errors for: non-isolate scope, non-bindToController)
});
