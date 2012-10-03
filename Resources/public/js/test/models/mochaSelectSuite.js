// Modularize the solum variable to make it easier to rename refactor
(function(root) {
  root.models.mocha = {};

  root.models.mocha.selectSuite = function() {
    var self = this;

    self.ajaxManager = root.getService('ajax', 'manager');
    self.actionType = ko.observable('');

    // Create a folder structure representation of the files
    self.filetree     = root.getComponent('tables', 'tree');

    // Rendering function for leaf nodes in the folder structure
    // Setup the links to point to the review page
    self.onLeaf = function($li, level) {
      var $a = $li.find('a');
      var target = $a.attr('data-solum-target-file');
      var url    = self.ajaxManager.generateURL('linkshare_solum_test_mocha_run_coverage', {});
      url = url + '?target=' + encodeURI(target);
      $a.attr('href', url);
    }

    self.getSuiteList = function() {
      self.ajaxManager.request(
        'linkshare_solum_test_mocha_get_suites',
        {},
        function(data) {
          self.filetree.addItems(data);
        }
      );
    }
  }
})(solum)


