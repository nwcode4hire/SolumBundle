/*
 * solum.js - tables
 * author: brandon eum
 * date: Sep 2012
 */

/**
 * Dependencies:
 *  - Assumes knockout.js
 *  - Assumes solum.js
 */

// Check if we are in a node.js environment for unit testing
if(typeof require == 'function') {
  solum = require('../solum.js');
  ko    = require('../../tests/mocks/mock-ko.js');
}

// The tables object is a module which abstracts the solum keyword
// Access services library (if needed) through root variable - easier to rename refactor later
solum.models.tables = (function(root){
  // Container for functions for the tables namespace
  var api  = {};

  /**
   * Paginated Table
   */
  api.paginatedTable = function() {
    // Prevent people from accidentally setting global variables by not using
    // the new keyword
    if(!(this instanceof api.paginatedTable)) return new api.paginatedTable();

    var self = this;

    // Private variable to store all of the public methods, enumerated at the
    // bottom in the API section
    var tableApi = {};

    // A public array of reports (has to be public for knockoutjs to manipulate)
    tableApi.list = ko.observableArray([]);

    // Set the page object, for information and for ajax requests, use the sister object directly
    tableApi.page = new api.page();

    // Knockout render functions
    tableApi.view              = {};
    tableApi.view.afterRender  = function(){};
    tableApi.view.afterAdd     = function(){};
    tableApi.view.beforeRemove = function(){};

    tableApi.addItem  = function(item) {
      self.list.push(item);
    }

    tableApi.addItems = function(items) {
      if(typeof items != "object" || items === null) throw "Add items helper requires an array. Received: " + typeof items;

      for(var i in items) {
        self.addItem(items[i]);
      }

      return items;
    }

    // Remove method assumes that the object has an ID field
    tableApi.removeItems = function(key, value) {
      var list = self.list();
      var temp = [];

      for(var i in list) {
        if(typeof list[i][key] == "undefined" || list[i][key] != value) {
          temp.push(list[i]);
        }
      }

      self.empty();
      self.addItems(temp);
    }

    // Helper to clear items.  This is different than removing because no ajax method
    // is called before clearing
    tableApi.empty = function() {
      self.list.splice(0, self.list().length);
    };

    // Reload function to empty then load list - Convenience function
    tableApi.reload = function(items) {
      self.empty();
      self.addItems(items);
    }

    /* PUBLIC tableApi - PUBLIC PROPERTIES AND METHODS HERE */
    // Properties
    this.list          = tableApi.list;
    this.view          = tableApi.view;
    this.page          = tableApi.page;

    // Methods
    this.addItem       = tableApi.addItem;
    this.addItems      = tableApi.addItems;

    this.removeItems    = tableApi.removeItems;
    this.empty         = tableApi.empty;
    this.reload        = tableApi.reload;
  }; // END Paginated Table

  api.groupedList = function() {
    // Prevent people from accidentally setting global variables by not using
    // the new keyword
    if(!(this instanceof api.groupedList)) return new api.groupedList();

    var self = this

    // Private variable to store all of the public methods, enumerated at the
    // bottom in the API section
    var groupedListApi = {}

    groupedListApi.groupedList = ko.observableArray([]);
    groupedListApi.table       = new api.paginatedTable();

    groupedListApi.view              = {};
    groupedListApi.view.afterRender  = function(){};
    groupedListApi.view.afterAdd     = function(){};
    groupedListApi.view.beforeRemove = function(){};

    // Property to group the list by
    groupedListApi.groupBy = ko.observable(null);
    groupedListApi.setGroupBy = function(p) {
      self.groupBy(p);
      self.groupItems();
    };

    // Clear all the elements in the list
    var empty = function() {
      self.groupedList.splice(0, self.groupedList().length);
    }

    // Take the groupBy property and attempt to group the simple list by that
    // property
    groupedListApi.groupItems = function(prop) {
      // Shortcut to set the groupBy property
      if(typeof prop == "string") self.groupBy(prop);

      var p = self.groupBy();
      empty();
      var list = self.table.list();

      // If the group-by property does not exist, put everything into a null group
      if(!p) {
        self.groupedList.push({
          property: null,
          // Copy the simple list into the grouped list
          entries: list.slice(0)
        });

        return;
      }

      // Loop through the list and construct the grouped list
      var temp = {};

      for(var i in list) {
        // If you are grouping by something it must exist on all objects in list
        if(typeof list[i][p] == "undefined") {
          throw "GroupedList.groupItems: group by property does not exist on one or more elements."
        }
        // Every distinct value of the property is stored as a key in the object
        // if it doesn't exist, create an empty array for entries, otherwise push
        else {
          if(typeof temp[list[i][p]] != "object") {
            temp[list[i][p]] = [];
          }

          temp[list[i][p]].push(list[i]);
        }
      }

      // Push all of the new elements in
      var t = null;
      for(var i in temp) {
        // Create an object with the category as a property and insert into the array
        t = {property: i, entries: temp[i]};
        self.groupedList.push(t);
      }
    }

    /* PUBLIC API - LIST PUBLIC METHODS AND PROPERTIES HERE */
    // Properties
    this.groupedList = groupedListApi.groupedList;
    this.table       = groupedListApi.table;
    this.view        = groupedListApi.view;

    // Methods
    this.groupBy     = groupedListApi.groupBy;
    this.setGroupBy  = groupedListApi.setGroupBy;
    this.groupItems  = groupedListApi.groupItems;
  }; // END GROUPEDLIST

  api.page = function() {
    // Prevent people from accidentally setting global variables by not using
    // the new keyword
    if(!(this instanceof api.page)) return new api.page();

    var self = this;

    // Will be called when the page or sort of the object is changed
    self.onChange = function() {return self;};

    self.page    = ko.observable(1);
    self.getPage = function() {return self.page();}
    self.setPage = function(num) {
      // Error conditions
      if(typeof num != "number") throw "Page: setPage only accepts a number";
      if(num < 1 || num > self.getTotalPages() || num == self.page()) return false;

      self.page(num);
      return self.onChange();
    };

    // Convenience methods to set the page
    self.first    = function() {return self.setPage(1);};
    self.next     = function() {return self.setPage(self.page() + 1);};
    self.previous = function() {return self.setPage(self.page() - 1);};
    self.last     = function() {return self.setPage(self.totalPages());};

    // Set the page to the first page or trigger the onChange
    self.setPageToFirstAndTriggerOnChange = function() {
      if(self.getPage() != 1) {
        return self.first();
      }
      else {
        return self.onChange();
      }
    }

    // Keep track of the totals
    self.totalPages = ko.observable();
    self.getTotalPages = function(){return self.totalPages();};

    self.totalCount = ko.observable(0);
    self.getTotalCount = function(){return self.totalCount();};
    self.setTotalCount = function(num) {
      if(typeof num != "number") throw "Total count must be a number";

      self.totalCount(num);
      self.totalPages(Math.ceil(self.totalCount()/self.pageSize()));

      return self;
    }

    self.defaultPageSize = 25;
    self.pageSize    = ko.observable(self.defaultPageSize);
    self.getPageSize = function() {return self.pageSize();};
    self.setPageSize = function(num) {
      if(typeof num != "number") throw "Page size must be a number";

      self.pageSize(num);
      self.totalPages(Math.ceil(self.totalCount()/self.pageSize()));
      self.setPageToFirstAndTriggerOnChange();
    };

    self.loadMore = function() {
      if(self.pageSize() >= self.totalCount()) return false;

      return self.setPageSize(self.pageSize() + self.defaultPageSize);
    };

    // Make the following available for KO Computed Functions
    self.hasMore        = ko.computed(function() {return (self.pageSize() < self.totalCount());});
    self.isFirstPage    = ko.computed(function() {return (self.page() == 1);});
    self.isNotFirstPage = ko.computed(function() {return (self.page() != 1);});
    self.isLastPage     = ko.computed(function() {return (self.page() == self.totalPages());});
    self.isNotLastPage  = ko.computed(function() {return (self.page() < self.totalPages());});

    // Sort Parameters
    self.sortCol = ko.observable(0);
    self.getSortCol = function() {return self.sortCol();};
    self.setSortCol = function(num) {
      if(typeof num != "number") throw "Sort column must be a number";

      self.sortCol(num);
      self.setPageToFirstAndTriggerOnChange();
    };

    self.sortDir = ko.observable("A");
    self.getSortDir = function() {return self.sortDir();};
    self.setSortDir = function(dir) {
      if(dir !== "A" && dir !== "D") throw "Sort direction must be 'A' or 'D'";

      self.sortDir(dir);
      self.setPageToFirstAndTriggerOnChange();
    };

    // Need a special private method for setting both the column and sort direction
    // without triggering the onChange function until both are done
    var setSort = function(col, dir) {
      self.sortCol(col);
      self.sortDir(dir);
      self.setPageToFirstAndTriggerOnChange();
    }

    // Switch the primary sort column or invert the sort direction
    self.toggleSort = function(colIdx) {
      var sort = null;
      var dir  = 'A';

      // Changing the sort column to something else (default to ascending)
      if(colIdx != self.getSortCol()) {
        dir = 'A';
        return setSort(colIdx, dir);
      }
      // Toggling direction of current sort column
      else {
        dir = (self.getSortDir() == 'A') ? 'D' : 'A';
        return setSort(colIdx, dir);
      }
    }

    self.toObj = function() {
      var rowStart = (self.page() - 1) * self.pageSize() + 1;
      var rowEnd   = self.page() * self.pageSize();

      return {
        start_row:      rowStart,
        end_row:        rowEnd,
        sort_col:       self.getSortCol(),
        sort_direction: self.getSortDir()
      };
    };

    // Rely on the setter's validation when de-serializing - order of setters matters
    self.fromObj = function(obj) {
      if(typeof obj != "object" || obj === null) throw "Page: fromObj() accepts only an object with the appropriate properties";

      var p = obj.EndRow/self.pageSize();

      self.setTotalCount(obj.TotalRows);
      self.page(p);

      return self;
    }
  } // END Page

  api.selectList = function() {
    if(!(this instanceof api.selectList)) return new api.selectList();
    var self = this;

    // This will hold the menu options
    self.items = new api.paginatedTable();

    // Holds the selected menu item
    self.selectedItem = ko.observable();
  }

  /**
   * Specifically meant to represent a file tree, but could be applied to most
   * trees that have been flattened out into a list.
   */
  api.tree = function() {
    if(!(this instanceof api.tree)) return new api.tree();
    var self = this;

    // Maintain a list of files in the raw list element
    self.raw = new api.paginatedTable();

    // Transformed files into a nice object with hierarchy
    self.hierarchy = new ko.observable({});

    // Reset the hierarchy to an empty object
    self.reset = function() {
      self.hierarchy({});
    }

    // Add items and trigger hierarchy reset
    self.addItems = function(items) {
        self.raw.addItems(items);
        self.createHierarchyFromRawList();
    }

    self.createHierarchyFromRawList = function(delim) {
      // Set the delimiter to be a slash by default
      delim = (typeof delim === 'undefined') ? '/' : delim;

      var list = self.raw.list();
      var hierarchy = {};
      for(var i in list) {
        var filepath = list[i].split(delim);

        // Reset the pointer to the current object
        var current = hierarchy;

        // Traverse down the hierarchy to split the files
        for(var j in filepath) {
          var s = filepath[j];
          // This is a leaf node (terminal node) and the value should be the full
          // file path
          if (s.indexOf('.js') !== -1) {
            current[s] = list[i];
          }
          // Make a new folder
          else if(typeof current[s] !== 'object') {
            current[s] = {};
            current = current[s];
          }
          // Folder exists
          else {
            current = current[s];
          }
        }
      }
      self.hierarchy(hierarchy);
    }

    return self;
  }


  return api;
})(solum);

if(typeof module == "object") {
  module.exports = solum;
}