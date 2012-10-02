/*
 * solum.js - date range model
 * author: brandon eum
 * date: Sep 2012
 */

/**
 * Dependencies:
 *  - Assumes jQuery
 *  - Assumes knockout.js
 *  - Assumes solum.js
 */

(function(root){
  root.models.dates = (function(){
    // Access services library through root variable - easier to rename refactor later

    // Container for functions for the tables namespace
    var api  = {};

    /**
     * A smart-date object with a label and an associated date range
     */
    api.smartDate = function() {
      var self = this;
      self.slug  = null;
      self.name  = null;
      self.dates = {
        start: ko.observable(),
        end:   ko.observable()
      };

      /**
       * @param data A JSON representation of this object
       */
      self.fromJSON = function(data) {
          self.slug = data.slug;
          self.name = data.name;
          self.dates.start(data.dates.start);
          self.dates.end(data.dates.end);
        }
    }

    /**
     * A list of smart dates that can be toggled through to reset the date range
     *
     * TODO: Refactor the date range model to use a sub-object for smart dates
     */
    api.smartDateMenu = {};


    /**
     * Represents a combination of a smart date menu and range input to have back
     * and forth communication between the smart date menu and range input.
     */
    api.dateRangeModel = function() {
      var self = this

      self.selectedSmartDate     = ko.observable();
      self.selectedSmartDateSlug = ko.observable();
      self.validator             = root.getService('validator');

      // TODO: Figure out why we need this
      self.hasChanged            = false;

      self.dates = new root.getEntity('dateRange'); // Instantiate a new date entity

      // Smart date options
      self.smartDates = ko.observableArray([])

      // Convenience method to add smart date options
      self.addSmartDates = function(smart_dates) {
          for(var i in smart_dates) {
            var sd = new api.SmartDate();
            sd.fromJSON(smart_dates[i]);
            self.smartDates.push(sd);
          }
        }

      /**
       * Listens for any changes to the selectedSmartDateSlug
       *   which is the slug value of a SmartDate object.
       */
      self.selectedSmartDateSlug.subscribe(function(selectedSlug){
        // get the SmartDate object we are using here
        var s = self.smartDates();

        var found = false;
        for(var i in s) {
          if (s[i].slug() == selectedSlug) {
            self.selectedSmartDate(s[i]);
            found = true;
          }
        }

        // Make sure it was a valid smart date
        if(!found) return false;

        // update the dates.start and dates.end properties
        var start = self.selectedSmartDate().dates.start();
        var end   = self.selectedSmartDate().dates.end();

        // Need to avoid recursive calls to the start/end date subscriptions
        ignoreDateSubscription = true;
        self.dates.start(start);
        self.dates.end(end);
        ignoreDateSubscription = false;
      });

      /**
       * When someone changes the date manually, it changes the date range to custom
       */
      var ignoreDateSubscription = false;

      self.updateToCustom = function() {
          var start = self.dates.start();
          var end   = self.dates.end();

          // Helps the page object determine whether or not to change the page back
          // to 1
          self.hasChanged = true

          self.validator.isEntityValid(self.dates);

          if(self.selectedSmartDateSlug() != 'custom' && !ignoreDateSubscription) {
            self.selectedSmartDateSlug('custom');

            // Will not create an infinite loop because the selectedSmartDateSlug is now 'custom'
            self.dates.start(start);
            self.dates.end(end);
          }
        }

      self.dates.start.subscribe(self.updateToCustom)
      self.dates.end.subscribe(self.updateToCustom)

      self.isCustomSelected = ko.computed(function() {
        return (self.selectedSmartDateSlug() == 'custom')
      }, this);
    }


    return api;
  })();
})(solum)



