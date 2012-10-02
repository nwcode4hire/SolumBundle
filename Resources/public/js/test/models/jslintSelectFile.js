// Modularize the solum variable to make it easier to rename refactor
(function(root) {
  root.models.jslint = {};

  root.models.jslint.selectFile = function() {
    var self = this;

    self.ajaxManager = root.getService('ajax');

    // Create a folder structure representation of the files
    self.filetree     = root.getModel('tables', 'tree');

    // Rendering function for leaf nodes in the folder structure
    // Setup the links to point to the review page
    self.onLeaf = function($li, level) {
      var $a = $li.find('a');
      var target = $a.attr('data-solum-target-file');
      var url    = self.ajaxManager.generateURL('solum_test_jslint_review_file', {});
      url = url + '?target=' + encodeURI(target);
      $a.attr('href', url);
    }

    self.getFileList = function() {
      self.ajaxManager.request(
        'solum_test_jslint_files',
        {},
        function(data) {
          self.filetree.addItems(data);
        }
      );
    }
  }
})(solum)


