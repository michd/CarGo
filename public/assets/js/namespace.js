(function (global, topNamespace) {
  "use strict";
  var ns =  global[topNamespace] !== undefined ?
      global[topNamespace] :
      {};

  ns.namespace = function (ns_string) {
    var
      parts = ns_string.split('.'),
      parent = ns,
      i = 0,
      iMax = 0;

    if (parts[0] === topNamespace) {
      parts = parts.slice(1); //remove redundant top level namespace
    }

    for (i = 0, iMax = parts.length; i < iMax; i += 1) {
      if (parent[parts[i]] === undefined) {
        //only create new object if part does not yet exist
        parent[parts[i]] = {};
      }
      parent = parent[parts[i]];
    }

    return parent;
  };

  global[topNamespace] = ns; //make app global
}(this, 'CARGO'));
