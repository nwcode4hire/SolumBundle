/**
 * This custom knockout binding can traverse a nested object and render a view
 * appropriately.
 */
(function() {
  var ulTemplate   = '<ul class="solum-tree-node level{level}"></ul>';
  var nodeTemplate = '<li class="solum-node"><div><i class="icon-folder-close"></i> <a href="#">{data}</a></div></li>';
  var leafTemplate = '<li class="solum-leaf"><div><i class="icon-file"></i> <a href="#" data-solum-target-file="{path}">{data}</a></div></li>';

  var createFolderTree = function(element, valueAccessor, allBindingsAccessor) {
    var values = ko.utils.unwrapObservable(valueAccessor())
    var data   = ko.utils.unwrapObservable(values.data);
    var onLeaf = ko.utils.unwrapObservable(values.onLeaf);
    var onNode = ko.utils.unwrapObservable(values.onNode);

    // OnLeaf and onNode must be functions for this to work properly
    if(typeof onLeaf !== 'function') {
        onLeaf = function(){};
    }
    if(typeof onNode !== 'function') {
        onNode = function($li, level) {
          $li.find('a').click(function() {
            $li.find('ul').toggle();
          });
        };
    }

    var ulTemp   = ko.utils.unwrapObservable(values.ulTemplate);
    var nodeTemp = ko.utils.unwrapObservable(values.nodeTemplate);
    var leafTemp = ko.utils.unwrapObservable(values.leafTemplate);

    ulTemplate   = (typeof ulTemp === 'string') ? ulTemp : ulTemplate;
    nodeTemplate = (typeof nodeTemp === 'string') ? nodeTemp : nodeTemplate;
    leafTemplate = (typeof leafTemp === 'string') ? leafTemp : leafTemplate;

    var $element = $(element);
    $element.empty();
    recursivelyAddRow($element, data, 0, onNode, onLeaf);

    // Hide all levels except for the first
    //$element.find('ul.solum-tree-node.level1').hide();
  }

  var recursivelyAddRow = function($target, data, level, onNode, onLeaf) {
    var $ul = $(ulTemplate.replace('{level}', level)).appendTo($target)

    if(typeof data === 'object' && typeof data !== null) {
      for(var i in data) {
        if(typeof data[i] === 'object' && typeof data[i] !== null) {
          var $li = appendNode($ul, level, i, onNode);
          recursivelyAddRow($li, data[i], level + 1, onNode, onLeaf);
        }
        // Skips number-index keys to enumerate files
        else {
          appendLeaf($ul, level, i, data[i], onLeaf);
        }
      }
    }
    // In case there is a file at the root level
    else {
      appendLeaf($ul, level, data, data, onLeaf);
    }
  }

  var appendNode = function($target, level, data, callback) {
    var $li = $(nodeTemplate.replace('{data}', data)).appendTo($target);
    callback($li, level);
    return $li;
  }

  var appendLeaf = function($target, level, data, path, callback) {
    var $li = $(leafTemplate.replace('{data}', data).replace('{path}', path)).appendTo($target);
    callback($li, level);
    return $li;
  }

  ko.bindingHandlers.folderTree = {
    init:   createFolderTree,
    update: createFolderTree
  }
})();