#!/usr/bin/env node
var recast = require("recast");
var b = recast.types.builders;

console.log("ng-d2c");

var args = process.argv.slice(2);

args.forEach(function (val) {
    console.log(': ' + val);
});

module.exports.convertString = function (code) {

    var ast = recast.parse(code);

    var errors = [];

    recast.visit(ast, {
            visitCallExpression: function (path) {
                var functionName = path.value.callee.property.name;
                if (functionName === "directive") {
                    errors = visitDirective(path);
                }
                this.traverse(path);
            }
        }
    );

    var output = undefined;
    if (errors.length === 0) {
        output = recast.print(ast).code;
    }
    return {
        code: output,
        errors: errors
    };
};

function visitDirective(path) {
    var errors = [];
    var directiveName = path.value.arguments[0];
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
                    restrictedToElement= true;
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
        if (errors.length === 0) {
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
        return errors;
    }
}
