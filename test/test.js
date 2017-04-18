var d2c = require("../index.js");
var assert = require("assert");
var EOL = require('os').EOL;

describe("ng-d2c", function () {
    it("should not touch existing component", () => {
        assert.equal(d2c.convertString('angular.module("foo").component("bar",{})').code, 'angular.module("foo").component("bar",{})');
    });

    it("should return error for directive without bindToController", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "E", scope: {}};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use bindToController");
    });

    it("should return error for directive without scope", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "E", bindToController: {}};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use isolate scope");
    });

    it("should return error for directive without isolate scope", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "E", bindToController: {}, scope: false};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use isolate scope");
    });


    it("should convert isolate scope object to bindings if bindToController is true", () => {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'restrict: "E",' +
            'scope: { hello: "="},' +
            'bindToController: true' +
            '};' +
            '});').code, 'angular.module("foo").component("bar",{' + EOL + '  bindings: { hello: "="}' + EOL + '});');
    });

    it("should convert bindToController object to bindings if bindToController is object", () => {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'restrict: "E",' +
            'scope: { hello: "="},' +
            'bindToController: { goodbye: "="}' +
            '};' +
            '});').code, 'angular.module("foo").component("bar",{' + EOL + '  bindings: { goodbye: "="}' + EOL + '});');
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
            'bindToController: true,' +
            'restrict: "E",' +
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
            'bindToController: true,' +
            'restrict: "E",' +
            '};' +
            '});');
        assert.equal(result.code, 'angular.module("foo").component("bar",{' + EOL +
            '  ' + 'bindings' + ': {},' + EOL +
            '  ' + propertyName + ': "TEST"' + EOL +
            '});');
        assert.equal(result.errors.length, 0);
    }

    it("should return error for directive without restrict", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {scope: {}, bindToController: {}};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive is not restricted to element (E)");
    });

    it("should return error for non-element directive", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "A", scope: {}, bindToController: {}};' +
            '});');
        assert.equal(result.code, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive is not restricted to element (E)");
    });

    it("can analyze without converting", () => {
        var code = 'angular.module("a").directive("b", function() { return ""; })';
        var result = d2c.analyzeString(code);
        assert.equal(result.code, code);
        assert.equal(result.errors.length, 1);
    });

    it("can analyze directive in file", () => {
        var directiveFiles = d2c.analyzeFiles("test/fixtures/invalid*.js");
        assert.equal(directiveFiles.length, 1);
        var directiveFile = directiveFiles[0];
        //TODO: directive name
        // assert.equal(directiveFile.name, "simple");
        assert.equal(directiveFile.file, "test/fixtures/invalidDirective.js");
        assert.equal(directiveFile.result.errors.length, 1);
        assert.equal(directiveFile.result.errors[0], "Directive does not return an object");
    });

    it("can convert directive in file", () => {
        var fs = require("fs");
        var content = fs.readFileSync("test/fixtures/simpleDirective.js", "utf8");
        var tmp = require('tmp');
        var tmpobj = tmp.fileSync();
        fs.writeFileSync(tmpobj.name, content);
        var directiveFiles = d2c.convertFiles([tmpobj.name]);
        var newComponentContent = fs.readFileSync(tmpobj.name, "utf8");
        var expectedComponentContent = fs.readFileSync("test/fixtures/simpleComponent.js", "utf8");
        assert.equal(directiveFiles.length, 1);
        assert.equal(directiveFiles[0].result.errors.length, 0);
        assert.equal(newComponentContent, expectedComponentContent);

    });

    //TODO: Convert file
    //TODO: Scan files, list directives that can be converted and those with errors
    //TODO: Error if multiple directives in same file
    //TODO: directive function without return
});
