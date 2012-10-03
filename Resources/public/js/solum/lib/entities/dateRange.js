/*global solum:true, $:true, ko:true, module:true */
/*
 * solum - date range entity
 * author: brandon eum
 * date: Sep 2012
 */

// Modularize so we can abstract the use of "solum" to root just in case we change the name
(function (root) {
  "use strict";

  /**
   * Represents a start and end date with validation
   */
  root.entities.dateRange = function () {
    var self, today, threeYearsAgo, localization, checkFormat, startConstraints;
    // Properties
    this.start = ko.observable('');
    this.end   = ko.observable('');

    // Constraints
    this.constraints = {
      start: [
        root.constructConstraint('general', 'notNull')        
      ],
      end: [
        root.constructConstraint('general', 'notNull')
      ]
    };
    
  };
}(solum));