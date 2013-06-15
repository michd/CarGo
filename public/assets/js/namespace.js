(function (global, topNamespace) {
  "use strict";

  // Set up the application's namespace and provide a method
  // of simply adding nested sub-namespaces

  var App = global[topNamespace] !== undefined ? global[topNamespace] : {};

  App.namespace = function (nsString) {
    var
      parts = nsString.split('.'),
      parent = App,
      i = 0;

    if (parts[0] === topNamespace) {
      parts = parts.slice(1); // Remove redundant top level namespace
    }

    for (i = 0; i < parts.length; i += 1) {

      // Only create new object if part does not yet exist
      if (parent[parts[i]] === undefined) {
        parent[parts[i]] = {};
      }

      parent = parent[parts[i]];
    }

    return parent;
  };

  // Make app global (ought to be the single global var of the application)
  global[topNamespace] = App;

}(this, 'CARGO'));
