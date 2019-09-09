var d2c = require("../lib/lib.js");
var assert = require("assert");
var EOL = require('os').EOL;
var fs = require("fs");

describe("ng-d2c", function () {
    it("can convert simple component in file", () => {
        assertFixture('simple');
    });

    function createTempCopy(path) {
        var content = fs.readFileSync(path, "utf8");
        var tmp = require('tmp');
        var tmpobj = tmp.fileSync();
        fs.writeFileSync(tmpobj.name, content);
        return tmpobj;
    }

    function removeQuotes(str) {
        return str.replace(/'/g, '').replace(/"/g, "");
    }

    function assertFixture(name) {
      var tmpobj = createTempCopy("test/fixtures/" + name + "Component.js");
      d2c.convertFile(tmpobj.name);
      var newComponentContent = fs.readFileSync(tmpobj.name, "utf8");
      var expectedComponentContent = fs.readFileSync("test/fixtures/" + name + "Component.ts", "utf8");
      assert.equal(newComponentContent, expectedComponentContent);
    }

    //TODO: multiple directives in same file, detect when analyzing, print all directive names + errors
    //TODO: directive function without return
    //TODO: Stop if directive function has parameters
    //TODO: Should require inline controller
});
