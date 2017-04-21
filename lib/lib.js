var recast = require("recast");
var b = recast.types.builders;
var glob = require("glob");

module.exports = {
    analyzeFiles: analyzeFiles,
    convertFiles: convertFiles,
    analyzeString: analyzeString,
    convertString: convertString,
};

function analyzeFiles(globPattern) {
    var foundFiles = glob.sync(globPattern);
    return foundFiles.map(function (file) {
        //console.log("Analyzing " + file);
        return {file: file, result: analyzeFile(file)};
    }).filter(function (file) {
        return file.result.hasDirective;
    });
}

function convertFiles(files) {
    files.forEach(function (file) {
        convertFile(file);
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
    if (converted.errors.length === 0) {
        fs.writeFileSync(file, converted.code);
    } else {
        throw new Error("Tried to convert non-compatible directive!");
    }
}

function visitCode(code, shouldConvert) {

    var ast = recast.parse(code);

    var errors = [];
    var hasDirective = false;

    recast.visit(ast, {
            visitCallExpression: function (path) {
                //TODO: Test for this if-statement
                if (path.value.callee.property) {
                    var functionName = path.value.callee.property.name;
                    //TODO: Test for number of arguments
                    if (functionName === "directive" && path.value.arguments.length === 2) {
                        hasDirective = true;
                        errors = visitDirective(path, shouldConvert);
                    }
                }
                this.traverse(path);
            }
        }
    );

    var output = undefined;
    if (hasDirective && errors.length === 0 && shouldConvert) {
        output = recast.print(ast).code;
    }
    return {
        code: output,
        errors: errors,
        hasDirective: hasDirective
    };
}

function visitDirective(path, shouldConvert) {
    var errors = [];
    var directiveName = path.value.arguments[0].value;
    var directiveReturnStatement = null;
    var directiveFunctionExpression = path.value.arguments[1];
    if (directiveFunctionExpression &&
        directiveFunctionExpression.body &&
        directiveFunctionExpression.body.body &&
        directiveFunctionExpression.body.body.length > 0) {
        //TODO: Verify that this is a return statement
        directiveReturnStatement = directiveFunctionExpression.body.body[directiveFunctionExpression.body.body.length - 1];
    }
    if (directiveReturnStatement) {
        var properties = [];
        var directiveProperties;
        var returnObj = directiveReturnStatement.argument;
        if (returnObj && returnObj.properties) {
            directiveProperties = returnObj.properties;
        } else {
            errors.push("Directive does not return an object");
            return errors;
        }
        var propertiesToCopy = {};
        var bindingsProperties = {};
        var whitelist = ["controller", "controllerAs", "require", "template", "templateUrl", "transclude"];
        var restrictedToElement = false;
        directiveProperties.forEach(function (prop) {
            if (whitelist.indexOf(prop.key.name) !== -1) {
                propertiesToCopy[prop.key.name] = prop.value;
            } else if (["scope", "bindToController"].indexOf(prop.key.name) !== -1) {
                bindingsProperties[prop.key.name] = prop.value;
            } else if (prop.key.name === "restrict") {
                if (prop.value && prop.value.value === "E") {
                    restrictedToElement = true;
                }
            } else {
                errors.push("Property cannot be converted safely: " + prop.key.name);
            }
        });
        if (!restrictedToElement) {
            errors.push("Directive is not restricted to element (E)");
        }
        if (!bindingsProperties["scope"] || bindingsProperties["scope"].type !== "ObjectExpression") {
            errors.push("Directive does not use isolate scope");
        }
        if (!bindingsProperties["bindToController"]) {
            errors.push("Directive does not use bindToController");
        }
        if (errors.length === 0 && shouldConvert) {
            // This is the point of no return, where we start rewriting the AST!
            path.value.callee.property.name = "component";
            if (bindingsProperties["bindToController"].type === "ObjectExpression") {
                properties.push(b.property("init", b.identifier("bindings"), bindingsProperties["bindToController"]));
            } else {
                properties.push(b.property("init", b.identifier("bindings"), bindingsProperties["scope"]));
            }
            for (var key in propertiesToCopy) {
                properties.push(b.property("init", b.identifier(key), propertiesToCopy[key]));
            }
            path.value.arguments[1] = b.objectExpression(properties);
        }
    }
    return errors;
}