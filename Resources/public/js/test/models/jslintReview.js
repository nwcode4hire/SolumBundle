// Modularize the solum variable to make it easier to rename refactor
(function(root) {
  root.models.jslint = {};

  root.models.jslint.review = function() {
    var self = this;

    self.ajaxManager = root.getService('ajax', 'manager');

    self.isTestDone = ko.observable(false);

    self.target = "";

    // For storing the result output
    self.jslintOutput = root.getComponent('tables', 'paginatedTable');

    // Make the ajax request to get the lint output
    self.lintReviewFile = function(target) {
      self.jslintOutput.empty();
      self.ajaxManager.request(
        'linkshare_solum_test_jslint_run',
        {data: {target: self.target}},
        function(data) {
          self.jslintOutput.addItems(data[1]);
          self.isTestDone(true);
        }
      );
    }

    // Clicking rows in the lint output causes that row in the code to highlight
    self.onLintErrorRowClick = function(error, event) {
      $('.line, .jslint-output tr').removeClass('jslint-highlight')
      var $ln = $('.line.number' + error.line);
      $ln.addClass('jslint-highlight');
      $(event.target).parents('tr').addClass('jslint-highlight');

      // Scroll to that position
      $(window).scrollTop($ln.offset().top - 50);
    }

    self.toggleLinkClickHandler = function() {
        $('.jslint-output-table').toggle();
    }
  }
}(solum))


