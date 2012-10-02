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

describe('solum:tables:page',function() {
  describe('Constructing a page with the solum.getModel method', function() {
    it('Should not require any arguments',function() {
      var page = solum.getModel('tables', 'page');
      page.page().should.equal(1);
    });
    it('Should default to page 1, total rows of 0, with size 25, and sort on 0 ascending', function() {
      var page = solum.getModel('tables', 'page');
      page.getPage().should.eql(1);
      page.getTotalCount().should.eql(0)
      page.getPageSize().should.eql(25);
      page.getSortCol().should.eql(0);
      page.getSortDir().should.eql('A')
    });
  });
  describe('page.setPage()', function() {
    it('Should only accept a number');
    it('Should change the page number if it is between 1 and the total number of pages');
    it('Should return false if the page number is less than 1 or greater than the total');
    it('Should execute the onChange method');
  });
  describe('page.first()', function() {
    it('Should set the page to 1');
  });
  describe('page.previous()', function() {
    it('Should set the page to the current page minus 1');
    it('Should return false if the current page is 1');
  });
  describe('page.next()', function() {
    it('Should increment the current page');
    it('Should return false if the current page is the last page');
  });
  describe('page.last()', function() {
    it('Should set the page to the last page');
    it('Should return false if the current page is the last page');
  });
  describe('page.setPageToFirstAndTriggerOnChange()', function() {
    it('Should set the page to the first page');
    it('Should always trigger the onChange callback');
  });
  describe('page.getTotalPages()', function() {
    it('Should return the total number of pages');
  });
  describe('page.getTotalCount()', function() {
    it('Should return the total row count');
  });
  describe('page.setTotalCount()', function() {
    it('Should only accept a number');
    it('Should set the number of rows and reset the page count based on the page size');
  });
  describe('page.defaultPageSize', function() {
    it('Should be 25');
  });
  describe('page.getPageSize()', function() {
    it('Should return the current page size');
  });
  describe('page.setPageSize()', function() {
    it('Should only accept a number')
    it('Should set the current page size and reset the total number of pages');
    it('Should set the page to the first page or execute the onChange function')
  });
  describe('page.loadMore()', function() {
    it('Should increment the page size by the default page size');
    it('Should return false if the current page size is already greater than or equal to the total count');
  });
  describe('page.loadMore()', function() {
    it('Should be a ko computed that returns a bool indicating if the page size is less than the total');
  });
  describe('page.isFirstPage()', function() {
    it('Should be a ko computed that indicates if the page is one');
  });
  describe('page.isNotFirstPage()', function() {
    it('Should be a ko computed that indicates if the page is not one');
  });
  describe('page.isLastPage()', function() {
    it('Should be a ko computed that indicates if the page is the last page');
  });
  describe('page.isNotLastPage()', function() {
    it('Should be a ko computed that indicates if the page is not the last page');
  });
  describe('page.getSortCol()', function() {
    it('Should return the current sort column');
  });
  describe('page.setSortCol()', function() {
    it('Should only accept a number');
    it('Should set the current sort column');
    it('Should set the page to the first page or execute the onChange function')
  });
  describe('page.getSortDir()', function() {
    it('Should return the current sort direction');
  });
  describe('page.setSortDir()', function() {
    it('Should only accept "A" or "D"');
    it('Should set the current sort direction');
    it('Should set the page to the first page or execute the onChange function')
  });
  describe('page.toggleSort()', function() {
    it('Should toggle the current sort direction if the column specified is already the sort column');
    it('Should set the sort column and set the direction to "A" if not the current sort column')
  });
  describe('page.toObj()', function() {
    it('Should serialize itself to an object with a start/end/total rows and the sort col/direction');
  });
  describe('page.fromObj()', function() {
    it('Should only accept an object');
    it('Should deserialize itself and set the total count and page');
  });
});
