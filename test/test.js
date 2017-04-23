var d2c = require("../lib/lib.js");
var assert = require("assert");
var EOL = require('os').EOL;
var fs = require("fs");

describe("ng-d2c", function () {
    it("should not touch existing component", () => {
        var result = d2c.convertString('angular.module("foo").component("bar",{})');
        assert.equal(result.generatedJs, undefined);
        assert.equal(result.errors.length, 0);
    });

    it("should return error for directive without bindToController", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "E", scope: {}};' +
            '});');
        assert.equal(result.generatedJs, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use bindToController");
    });

    it("should return error for directive without scope", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "E", bindToController: {}};' +
            '});');
        assert.equal(result.generatedJs, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive does not use isolate scope");
    });

    it("should return error for directive without isolate scope", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "E", bindToController: {}, scope: false};' +
            '});');
        assert.equal(result.generatedJs, undefined);
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
            '});').generatedJs, 'angular.module("foo").component("bar",{' + EOL + '  bindings: { hello: "="}' + EOL + '});');
    });

    it("should convert bindToController object to bindings if bindToController is object", () => {
        assert.equal(d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {' +
            'restrict: "E",' +
            'scope: { hello: "="},' +
            'bindToController: { goodbye: "="}' +
            '};' +
            '});').generatedJs, 'angular.module("foo").component("bar",{' + EOL + '  bindings: { goodbye: "="}' + EOL + '});');
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
        assert.equal(result.generatedJs, undefined);
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
        assert.equal(result.generatedJs, undefined);
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
        assert.equal(result.generatedJs, 'angular.module("foo").component("bar",{' + EOL +
            '  ' + 'bindings' + ': {},' + EOL +
            '  ' + propertyName + ': "TEST"' + EOL +
            '});');
        assert.equal(result.errors.length, 0);
    }

    it("should return error for directive without restrict", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {scope: {}, bindToController: {}};' +
            '});');
        assert.equal(result.generatedJs, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive is not restricted to element (E)");
    });

    it("should return error for non-element directive", () => {
        let result = d2c.convertString('angular.module("foo").directive("bar",function () {' +
            'return {restrict: "A", scope: {}, bindToController: {}};' +
            '});');
        assert.equal(result.generatedJs, undefined);
        assert.equal(result.errors.length, 1);
        assert.equal(result.errors[0], "Directive is not restricted to element (E)");
    });

    it("can analyze without converting", () => {
        var code = 'angular.module("a").directive("b", function() { return ""; })';
        var result = d2c.analyzeString(code);
        assert.equal(result.generatedJs, undefined);
        assert.equal(result.errors.length, 1);
    });

    it("can analyze directive in file", () => {
        var directiveFiles = d2c.analyzeDirectiveFiles("test/fixtures/invalid*.js");
        assert.equal(directiveFiles.length, 1);
        var directiveFile = directiveFiles[0];
        //TODO: directive name
        // assert.equal(directiveFile.name, "simple");
        assert.equal(directiveFile.path, "test/fixtures/invalidDirective.js");
        assert.equal(directiveFile.errors.length, 1);
        assert.equal(directiveFile.errors[0], "Directive does not return an object");
    });

    it("can analyze file without directive", () => {
        var directiveFiles = d2c.analyzeDirectiveFiles("test/fixtures/simpleComponent.js");
        assert.equal(directiveFiles.length, 0);
    });

    it("can convert simple directive in file", () => {
        var tmpobj = createTempCopy("test/fixtures/simpleDirective.js");
        d2c.convertFile(tmpobj.name);
        var newComponentContent = fs.readFileSync(tmpobj.name, "utf8");
        var expectedComponentContent = fs.readFileSync("test/fixtures/simpleComponent.js", "utf8");
        assert.equal(newComponentContent, expectedComponentContent);
    });

    it("can convert multiple directives in one file", () => {
        var tmpobj = createTempCopy("test/fixtures/multiDirective.js");
        d2c.convertFile(tmpobj.name);
        var newContent = fs.readFileSync(tmpobj.name, "utf8");
        var expectedContent = fs.readFileSync("test/fixtures/multiComponent.js", "utf8");
        assert.equal(newContent,expectedContent);
    });

    it("can convert advanced directive in file", () => {
        var tmpobj = createTempCopy("test/fixtures/advancedDirective.js");
        d2c.convertFile(tmpobj.name);
        var newComponentContent = fs.readFileSync(tmpobj.name, "utf8");
        var expectedComponentContent = fs.readFileSync("test/fixtures/advancedComponent.js", "utf8");
        assert.equal(newComponentContent, expectedComponentContent);
    });

    function createTempCopy(path) {
        var content = fs.readFileSync(path, "utf8");
        var tmp = require('tmp');
        var tmpobj = tmp.fileSync();
        fs.writeFileSync(tmpobj.name, content);
        return tmpobj;
    }

    //TODO: multiple directives in same file, detect when analyzing, print all directive names + errors
    //TODO: directive function without return
});
