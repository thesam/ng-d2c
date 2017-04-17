module.exports.convertString = function (code) {
    var recast = require("recast");

    var ast = recast.parse(code);
    var b = recast.types.builders;

    recast.visit(ast, {
            visitCallExpression: function (path) {
                var functionName = path.value.callee.property.name;
                if (functionName === "directive") {
                    var directiveName = path.value.arguments[0];
                    var directiveFunctionExpression = path.value.arguments[1];
                    // console.log(directiveName);
                    // console.log(directiveFunctionExpression);
                    path.value.callee.property.name = "component";
                    path.value.arguments[1] = b.objectExpression([]);
                }
                this.traverse(path);
            }
        }
    );

    // console.log(ast.program.body);
    var output = recast.print(ast).code;
    return output;
}
