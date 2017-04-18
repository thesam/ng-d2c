var d2c = require("../index.js");
var assert = require("assert");
var EOL = require('os').EOL;

describe("ng-d2c", function () {
    it("should not touch existing component", () => {
        assert.equal(d2c.convertString('angular.module("foo").component("bar",{})').code, 'angular.module("foo").component("bar",{})');
    });

    it("should convert isolate scope object to bindings", () => {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'scope: { hello: "="},' +
            'bindToController: true' +
            '};' +
            '});').code, 'angular.module("foo").component("bar",{' + EOL + '  bindings: { hello: "="}' + EOL + '});');
    });

    it("should return error for directive without bindToController", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {scope: {}};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use bindToController");
    });

    it("should return error for directive without isolate scope", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {bindToController: {}};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use isolate scope");
    });

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

    it("should copy supported properties to component object", () => {
        testSupportedProperty("controller");
        testSupportedProperty("controllerAs");
        testSupportedProperty("require");
        testSupportedProperty("template");
        testSupportedProperty("templateUrl");
        testSupportedProperty("transclude");
    });

    function testUnsupportedProperty(propertyName) {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            propertyName + ': "TEST",' +
                'scope: {},' +
                'bindToController: true' +
            '};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Property cannot be converted safely: " + propertyName);
    }

    function testSupportedProperty(propertyName) {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            propertyName + ': "TEST",' +
            'scope: {},' +
            'bindToController: true' +
            '};' +
            '});');
        assert.equal(result.code, 'angular.module("foo").component("bar",{' + EOL +
            '  ' + 'bindings' + ': {},' + EOL +
            '  ' + propertyName + ': "TEST"' + EOL +
            '});');
        assert.equal(result.errors.length, 0);
    }


    //TODO: Convert file
    //TODO: restrict == E
    //TODO: Scan files, list directives that can be converted and those with errors
    //TODO: if bindToController=true, use scope object
    //TODO: if bindToController is obj and scope is obj, use bindToController
    //TODO: Different combos of scope/bindToController (separate errors for: non-isolate scope, non-bindToController)
    //TODO: Error if multiple directives in same file
});
