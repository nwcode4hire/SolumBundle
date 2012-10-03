/**
 * All constraints related to strings
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
  constraints.string = {};

  constraints.string.minLength = function (params, msg) {
    var self = this;
    self.defaultMsg = 'errors.form.string.min_length';

    msg = (msg) ? msg : self.defaultMsg;
    constraints.abstractConstraint.call(self, params, msg);

    self.test = function (subject) {
      if (subject.length < self.params.min) {
        throw {error: self.msg};
      }
      return true;
    };
  };

  constraints.string.maxLength = function (params, msg) {
    var self = this;
    self.defaultMsg = 'errors.form.string.max_length';

    msg = (msg) ? msg : self.defaultMsg;
    constraints.abstractConstraint.call(self, params, msg);

    this.test = function (subject) {
      if (subject.length > self.params.max) {
        throw {error: self.msg};
      }
      return true;
    };
  };

  constraints.string.match = function (params, msg) {
    var self = this;
    self.defaultMsg = 'errors.form.string.match';

    msg = (msg) ? msg : self.defaultMsg;
    constraints.abstractConstraint.call(self, params, msg);

    this.test = function (subject) {
      if (subject.match(self.params.regex)) {
        throw {error: self.msg};
      }
      return true;
    };
  };
}(solum));
