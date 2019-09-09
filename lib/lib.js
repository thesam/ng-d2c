var recast = require("recast");
var b = recast.types.builders;
var glob = require("glob");

module.exports = {
    analyzeDirectiveFiles: analyzeDirectiveFiles,
    convertFile: convertFile,
    analyzeString: analyzeString,
    convertString: convertString,
};

function analyzeDirectiveFiles(globPattern) {
    var foundFiles = glob.sync(globPattern);
    return foundFiles.map(function (file) {
        var result = analyzeFile(file);
        result.path = file;
        return result;
    }).filter(function (file) {
        return file.hasDirective;
    });
}

function analyzeString(code) {
    return visitCode(code, false);
}

function convertString(code) {
    return visitCode(code, true);
}

function analyzeFile(file) {
    var fs = require("fs");
    var content = fs.readFileSync(file, "utf8");
    return analyzeString(content);
}

function convertFile(file) {
    var fs = require("fs");
    var content = fs.readFileSync(file, "utf8");
    var converted = convertString(content);
    if (converted.errors.length === 0 && converted.generatedJs) {
        fs.writeFileSync(file, converted.generatedJs);
    } else {
        throw new Error("Tried to convert non-compatible directive!");
    }
}

function visitCode(code, shouldConvert) {

    var ast = recast.parse(code);

    var output;

    recast.visit(ast, {
            visitCallExpression: function (path) {
                //TODO: Test for this if-statement
                if (path.value.callee.property) {
                    var functionName = path.value.callee.property.name;
                    //TODO: Test for number of arguments
                    if (functionName === "component" && path.value.arguments.length === 2) {
                        output = visitDirective(path, shouldConvert);
                    }
                }
                this.traverse(path);
            }
        }
    );

    console.log(output);

    return {
        generatedJs: output.ts,
        errors: output.errors,
        hasDirective: true,
    };
}

function visitDirective(path, shouldConvert) {
    var errors = [];
    var ts;
    var directiveName = path.value.arguments[0].value;
    var directiveReturnStatement = null;
    //TODO: Verify that this is a function
    //console.log(path.value);
    var componentObjectExpression = path.value.arguments[1];
    var properties = [];
    var directiveProperties;
    directiveProperties = componentObjectExpression.properties;
    ts = "export class SimpleComponent {}\n";
    return {ts,errors};
}
