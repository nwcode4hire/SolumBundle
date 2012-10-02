var should = require('should');

var lib = '../../../'
if(typeof process == "object" && typeof process.env == "object" && process.env['MOCHA_USE_COVERAGE_LIB'] == 1) {
  lib += 'lib-cov';
}
else {
  lib += 'lib'
}

// Let the user know the library being used
console.log("\033[33m  The JS library being used is: " + lib);

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

describe('solum:tables:paginatedTable',function() {
  describe('Constructing a paginatedTable with the solum.getModel method', function() {
    it('Should not require any arguments',function() {
      var table = solum.getModel('tables', 'paginatedTable');
      table.list().should.have.length(0)
    })
    it('Should have a list property that is a ko.observableArray', function() {
      var table = solum.getModel('tables', 'paginatedTable');
      table.list.isKoObservableArray.should.be.true;
    })
    it('Should have a page property that is an instance of solum.models.tables.page', function() {
      var table = solum.getModel('tables', 'paginatedTable');
      table.page.should.be.an.instanceof(solum.models.tables.page);
    })
    describe('The "view" property', function(){
      it('Should have default functions for the afterRender, afterAdd, beforeRemove ko helpers', function() {
        var table = solum.getModel('tables', 'paginatedTable');
        table.view.afterAdd.should.be.a("function");
        table.view.afterRender.should.be.a("function");
        table.view.beforeRemove.should.be.a("function");
      })
    })
  })
  describe('Adding items to the list', function(){
    describe('Using the addItem() method', function(){
      it('Should add the item to the list and increase the length by 1', function(){
        var table = solum.getModel('tables', 'paginatedTable');
        table.addItem(item);
        table.list()[0].should.equal(item);
        table.list().should.have.length(1);
      })
    })
    describe('Using the addItems() method', function(){
      it('Should only accept an object', function(){
        var table = solum.getModel('tables', 'paginatedTable');
        var a = function(){ table.addItems(itemList); };
        a.should.not.throw();

        a = function() { table.addItems(1); };
        a.should.throw();
        a = function() { table.addItems(true); };
        a.should.throw();
        a = function() { table.addItems(null); };
        a.should.throw();
        a = function() { table.addItems(); };
        a.should.throw();
        a = function() { table.addItems("afs"); };
        a.should.throw();
        a = function() { table.addItems(function(){}); };
        a.should.throw();
      })
      it('Should add all of the items from an object to the list', function(){
        var table = solum.getModel('tables', 'paginatedTable');
        table.addItems(itemList);
        table.list().should.eql(itemList);
        table.list().length.should.eql(itemList.length);
      })
    })
  })
  describe('Clearing the list via the empty() method',function(){
    it('Should remove all elements from the list',function(){
      var table = solum.getModel('tables', 'paginatedTable');
      table.addItems(itemList);
      table.list().should.eql(itemList);
      table.list().length.should.eql(itemList.length);

      table.empty();
      table.list().should.eql([]);
      table.list().length.should.eql(0);
    })
  })
  describe('Removing an item via removeItems', function(){
    it('Should remove all items for which the key matches the value', function(){
      var table = solum.getModel('tables', 'paginatedTable');
      var l     = itemList.slice(0);
      table.addItems(l);
      table.list().should.eql(itemList);
      table.list().length.should.eql(itemList.length);

      table.removeItems('id', 2);
      table.list().length.should.eql(itemList.length - 1);

      table.removeItems('jello', 4);
      table.list().length.should.eql(itemList.length - 3);
    })
    it('Should not throw an error when the key to test items against does not exist', function() {
      var table = solum.getModel('tables', 'paginatedTable');
      table.addItems(itemList);
      var a = function() { table.removeItems('marcus', 2); };
      a.should.not.throw();
    })
    it('Should not remove any items when the key to test items against does not exist', function(){
      var table = solum.getModel('tables', 'paginatedTable');
      table.addItems(itemList);
      table.removeItems('marcus', 2);
      table.list().length.should.eql(itemList.length);
    })
  })
})
