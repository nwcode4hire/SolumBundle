var should = require('should');

var lib = '../../../'
if(typeof process == "object" && typeof process.env == "object" && process.env['MOCHA_USE_COVERAGE_LIB'] == 1) {
  lib += 'lib-cov';
}
else {
  lib += 'lib'
}

// Let the user know the library being used
console.log("\033[33m  The JS library being used is: " + lib + '\033[0m');

// Mocks to include
var ko = require('../../mocks/mock-ko.js');
var $  = require('../../mocks/mock-jquery.js');

// Solum libraries to include
solum = require(lib + '/models/tables.js');

// Fixture list data
var item = {id: 0, hello:0, jello:0};
var itemList =
[
  {id: 1, hello:1, jello:1},
  {id: 2, hello:2, jello:2},
  {id: 3, hello:3, jello:2},
  {id: 4, hello:4, jello:4},
  {id: 5, hello:5, jello:4},
  {id: 6, hello:6, jello:6}
];

var groupedList = [
  {
    property: 1,
    entries: [
      {id: 1, hello:1, jello:1}
    ]
  },
  {
    property: 2,
    entries: [
      {id: 2, hello:2, jello:2},
      {id: 3, hello:3, jello:2}
    ]
  },
  {
    property: 4,
    entries: [
      {id: 4, hello:4, jello:4},
      {id: 5, hello:5, jello:4}
    ]
  },
  {
    property: 6,
    entries: [
      {id: 6, hello:6, jello:6}
    ]
  },
];

describe('solum:tables:groupedList',function() {
  describe('Constructing a grouped list with the solum.getModel method', function() {
    it('Should not require any arguments',function() {
      var list = solum.getModel('tables', 'groupedList');
      list.table.list().should.have.length(0);
      list.groupedList().should.have.length(0);
    });
    it('Should have a list property that is a ko.observableArray', function() {
      var list = solum.getModel('tables', 'groupedList');
      list.groupedList.isKoObservableArray.should.be.true;
    });
    it('Should have a page property that is an instance of solum.models.tables.paginatedTable', function() {
      var list = solum.getModel('tables', 'groupedList');
      list.table.should.be.an.instanceof(solum.models.tables.paginatedTable);
    });
  })
  describe('The "view" property', function(){
    it('Should have default functions for the afterRender, afterAdd, beforeRemove ko helpers', function() {
      var list = solum.getModel('tables', 'groupedList');
      list.view.afterAdd.should.be.a("function");
      list.view.afterRender.should.be.a("function");
      list.view.beforeRemove.should.be.a("function");
    });
  });
  describe('groupedList.setGroupBy()', function() {
    it('Should set the groupBy field and re-group items', function() {
      var list = solum.getModel('tables', 'groupedList');
      list.table.addItems(itemList);
      list.setGroupBy('jello');
      list.groupedList().length.should.equal(4);

      list.setGroupBy('id');
      list.groupedList().length.should.equal(6);
    });
  });
  describe('groupedList.groupItems()', function() {
    it('Should group the list based on the groupBy property', function() {
      var list = solum.getModel('tables', 'groupedList');
      list.table.addItems(itemList);
      list.setGroupBy('jello');

      var grouped = list.groupedList();
      var found   = false;

      for(var i in grouped) {
        found = false;
        for(var j in groupedList) {
          if(grouped[i].property == groupedList[j].property) {
              grouped[i].entries.length.should.eql(groupedList[j].entries.length);
              found = true;
          }
        }

        if(!found) {
          throw "An expected property was not found: " + grouped[i].property;
        }
      }
    });
    it('Should put all items into the "null" group if groupBy is not defined', function() {
      var list = solum.getModel('tables', 'groupedList');
      list.table.addItems(itemList);
      list.setGroupBy(null);
      var grouped = list.groupedList();
      var isNull  = (grouped[0].property === null)

      isNull.should.be.true;
      grouped[0].entries.length.should.eql(itemList.length);
    });
  });
});
