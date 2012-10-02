/*
 * solum - date range entity
 * author: brandon eum
 * date: Sep 2012
 */

// Modularize so we can abstract the use of "solum" to root just in case we change the name
(function(root){


  /**
   * Represents a start and end date with validation
   */
  root.entities.dateRange = function() {
    // Properties
    this.start = ko.observable('');
    this.end   = ko.observable('');

    // Constraints
    var self          = this;
    var today         = Date.today();
    var threeYearsAgo = Date.today().add({years: -3});

    var localization =  root.config.dateAndNumberFormatLocalization;
    var checkFormat = localization[root.config.locale]

    // TODO: Check if the message translations are relevant
    var startConstraints = [
      {
        constraint: 'notNull',
        msgTranslations: {
          START_END_DATE: {value: 'start date', mustTranslate: true, type: 'string'}
        }
      },
      {constraint: 'date', params: {localization: checkFormat}},
      {
        constraint: 'minDate',
        params: {minDate: threeYearsAgo},
        msgTranslations: {
          THREE_YEARS_AGO: {value: threeYearsAgo, mustTranslate: true, type: 'date'}
        }
      },
      {
        constraint: 'maxDate',
        params: {maxDate: today},
        msgTranslations: {
          TODAY: {value: today, mustTranslate: true, type: 'date'}
        }
      },
      {
        constraint: function(s, checkFormat) {
          var delim  = checkFormat.delim;
          var map    = checkFormat.map;

          // Avoid situations where one of the dates is not initialized
          if(self.start() == null || self.end() == null) return;

          // Y/M/d value validation
          var vals  = self.start().split(delim);
          var year  = Number(vals[map.year]);
          var month = Number(vals[map.month]);
          var day   = Number(vals[map.day]);
          var start = new Date(year, month, day);

          vals    = self.end().split(delim);
          year    = Number(vals[map.year]);
          month   = Number(vals[map.month]);
          day     = Number(vals[map.day]);
          var end = new Date(year, month, day);

          if(start > end) throw {error: "errors.form.date.start_greater_than_end"};

          return true;
        },
        params: checkFormat
      }
    ];

    this.constraints = {
        start: startConstraints,
        end:   [
          {constraint: 'notNull'},
          {constraint: 'date', params: {localization: checkFormat}},
          {constraint: 'minDate', params: {minDate: threeYearsAgo}},
          {constraint: 'maxDate', params: {maxDate: today}}
        ]
    };

    root.constructEntity(this);
  };
})(solum);