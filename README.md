# ng-d2c (Angular directive to component)
Converts AngularJS directives to components. Tries to avoid converting directives that can not be converted safety. 

Directives are overwritten in-place. The purpose of this tool is to perform a one-time migration to the new component syntax.

### Before
```
angular.module("foo").directive("simple", function () {
    return {
        scope: {},
        bindToController: true,
        restrict: "E"
    };
});
```
### After
```
angular.module("foo").component("simple", {
    bindings: {}
});
```

## Usage
### 1. Analyze
```
# Find and analyze directives in .js files in the current directory and subdirectories
$ ng-d2c
OK: advancedDirective.js
OK: multiDirective.js
OK: simpleDirective.js
FAIL: invalidDirective.js
        Directive does not return an object
OK: 3 (Can be converted)
FAIL: 1 (Can not be converted until errors are fixed)
```
### 2. Convert
WARNING: Always use version control software and review the changes made by this tool before committing your new components!
```
# Convert all directives which can be converted safely in the current directory and subdirectories
$ ng-d2c convert
Converting: advancedDirective.js
Converting: multiDirective.js
Converting: simpleDirective.js

```