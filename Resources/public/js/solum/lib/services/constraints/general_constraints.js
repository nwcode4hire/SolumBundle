/**
 * Constraints for any type of subject
 */

// Check if we are in a node.js environment for unit testing
if (typeof require === 'function') {
  solum = require('../solum.js');
  ko    = require('../../tests/mocha/mocks/mock-ko.js');
}

// Access services library (if needed) through root variable - easier to rename refactor later
(function (root) {
  "use strict";

  var constraints = root.services.validation.constraints;
  constraints.general = {};

  constraints.general.notNull = function (params, msg) {
    var self = this;
    self.defaultMsg = 'errors.form.general.not_null';

    msg = (msg) ? msg : self.defaultMsg;
    constraints.abstractConstraint.call(self, params, msg);

    self.test = function (subject) {
      if (subject === '' || subject === null || subject === undefined) {
        throw {error: self.msg};
      }
      return true;
    };
  };

  constraints.general.type = function (params, msg) {
    var self = this;
    self.defaultMsg = 'errors.form.general.type';

    msg = (msg) ? msg : self.defaultMsg;
    constraints.abstractConstraint.call(self, params, msg);

    self.test = function (subject) {
      if ((self.params.type === "null" && subject !== null) || typeof subject !== self.params.type) {
        throw {error: self.msg};
      }
      return true;
    };
  };


}(solum));
