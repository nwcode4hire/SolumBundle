/**
 * solum.js
 * Author: Brandon Eum
 * Created: Sep 2012
 */

/**
 * Dependencies:
 *  - Assumes jQuery
 *  - Assumes knockout.js
 */

// Setup mock dependencies if we are in a node.js unit test environment
if(typeof require == 'function') {
  ko = require('../tests/mocks/mock-ko.js');
  $  = require('../tests/mocks/mock-jquery.js');
  localStorage   = {};
  sessionStorage = {};
}

var solum = (function() {
  var self = this;

  // Keep as a function just in case we want to do something with it later
  var api = function(){};

  /**
   * Provide a clean way to do inheritance in JS
   */
  api.extend = function(subclass, superclass) {
    var F = function(){};
    F.prototype = superclass.prototype;
    subclass.prototype = new F();
    subclass.prototype.constructor = subclass;

    // Provide the constructor of the superclass to the subclass
    subclass.superclass = superclass.prototype;
  };

  /**
   * Library-wide configurations that will be used by more than one service/model
   *
   * Right now, its just date/number localization, but could be other things in
   * the future.
   */
  api.config = {
    locale: "en",
    dateAndNumberFormatLocalization: {
      en: {
        date: {
          long_format: 'MMMM d, yyyy',
          format:      'yyyy-M-dd',
          pattern:     /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
          delimiter:   '-',
          map:         {year: 2, month: 1, day: 0}
        },
        number: {
          thousand_delimiter: ',',
          decimal:            '.'
        },
        currency: {
          currency_symbol:    '&#36;',
          thousand_delimiter: ',',
          decimal:            '.'
        }
      }
    }
  };

  /**
   * The locale is used in the translator and validator (for date formats) and is
   * important enough that it deserves its own setter.
   */
  api.setLocale = function(loc) {
      api.config.locale = loc;
  }

  /**
   * The models namespace is not implemented in this file, but accepts plug-in
   * files that will use the services defined here to create re-useable models with
   * knockout and jquery.
   */
  api.models = {};

  api.getModel = function(group, model) {
    if(typeof api.models[group] == 'object' && typeof api.models[group][model] == 'function') {
        return new api.models[group][model]();
    }
    else {
      throw "The requested model does not exist.";
    }
  }

  /**
   * The entities namespace is used to represent objects in your system.  They have
   * properties and methods and know how to validate themselves for client-side
   * validation.
   */
  api.entities = {};

  /**
   * Adds all of the necessary standard properties to the entity
   */
  api.constructEntity = function(entity) {
    var i;
    entity.errors = {};
    for(i in entity) {
      entity.errors[i] = ko.observableArray([]);
    }

    // Add a convenience method for checking if there are errors
    entity.hasError = ko.computed(function() {
      for(i in this.errors) {
        if(this.errors[i]().length > 0) return true;
      }

      return false;
    }, entity);

    // Make the standard properties non-enumerable -- Does not work in IE8 grrr...
    if(typeof Object.defineProperty == 'function') {
      Object.defineProperty(entity, 'constraints', {enumerable: false})
      Object.defineProperty(entity, 'errors',      {enumerable: false})
      Object.defineProperty(entity, 'hasError',    {enumerable: false})
    }
  }

  /**
   * It is a requirement that entities have no arguments in their constructor so
   * that we can use a generic get method to get the entity.
   */
  api.getEntity = function(name) {
    if(typeof name != 'string') throw "The entity name must be a string";

    return new self.entities[name]();
  }

  /**
   * Be lazy about constructing instances of each service, and only construct them
   * as needed.  They should be singleton objects, so store the single instance
   * here.
   */
  api.instances            = {};
  api.instances.ajax       = null;
  api.instances.validator  = null;
  api.instances.translator = null;

  /**
   * Get the singleton of one of the mirage services, if it is not constructed,
   * construct it here.
   */
  api.getService = function(name) {
    if(name == 'ajax') {
      return getSingleton(api.instances.ajax, api.services.ajax.manager);
    }
    else if(name == 'validator') {
      return getSingleton(api.instances.validator, api.services.validator);
    }
    else if(name == 'translator') {
      return getSingleton(api.instances.translator, api.services.translator);
    }
    else {
      throw 'Mirage.get(): you called a non-existant service: ' + name;
    }
  };

  /**
   * Configure the options for a particular service, this will instantiate the
   * service if it does not already exist.  This will also change the global config
   * for that service for all cases that you are using it.
   */
  api.configureService = function(name, config) {
    if(name == 'ajax') {
      api.instances.ajax = new api.services.ajax.manager(config);
    }
    else if(name == 'validator') {
      api.instances.validator = new api.services.validation.validator(config);
    }
    else if(name == 'translator') {
      api.instances.translator = new api.services.translation.translator(config);
    }
    else {
      throw 'Configure Service: you called a non-existant service: ' + name;
    }
  }

  /**
   * If an instance exists, return that, otherwise construct and set the singleton
   * to be the newly constructed instance
   */
  var getSingleton = function(instance, constructor, config) {
    if(instance === null) {
      return new constructor(config);
    }
    else {
      return instance;
    }
  }

  /**
   * Services namespace houses:
   *  - Ajax Management
   *  - Validation
   *  - Symfony-style Translation
   */
  api.services = {};

  /**
   * Ajax namespace for all of the ajax-related services and functions
   */
  api.services.ajax = {};

  api.services.ajax.routes = {
    exampleRoute: {
      name: 'exampleRoute',
      url:  '/example/{param}',
      method: 'GET',
      // These are replaces in the url matched with {} brackets
      params: [
        {name: "param", defaultValue: "my default"} // Leave "defaultValue" undefined to make it required
      ]
    }
  };

  // Convenience methods for adding additional routes vs just replacing the route
  // object
  api.addAjaxRoutes = function(routes) {
    api.services.ajax.routes = $.extend(routes, api.services.ajax.routes);
  }

  /**
   * Allow users to view the default configuration of the Ajax Manager
   */
  api.services.ajax.defaultConfig = {
    prefix: "", // Prefix to add to all AJAX requests
    ajax: $.ajax, // Method to call to make an ajax request
    badRequestHandler: function(){}, // Deals with 400 errors
    errorHandler: function(){} // Deals with errors other than 400
  };

  /**
   * The ajax manager is a wrapper over the jQuery ajax function that allows for
   * symfony-style routes with dynamic URL parameters and query string parameters.
   *
   * It also holds onto any ongoing request and aborts it if another request is
   * attempted.
   */
  api.services.ajax.manager = function(config) {
    var self = this;

    // Merge the new config with the default configurations
    config = $.extend({}, api.services.ajax.defaultConfig, config);

    var managerApi = {};

    var prefix            = config.prefix;
    var ajax              = config.ajax;
    var badRequestHandler = config.badRequestHandler;
    var errorHandler      = config.errorHandler;

    // Status flag should be one of: "OK","LOADING","FAILED","BAD_REQUEST"
    managerApi.status = ko.observable("OK");

    // Provide simple computed functions to monitor status of the ajax manager
    managerApi.isOK         = ko.computed(function() {return (managerApi.status() == "OK");}, this);
    managerApi.isLoading    = ko.computed(function() {return (managerApi.status() == "LOADING");}, this);
    managerApi.isFailed     = ko.computed(function() {return (managerApi.status() == "FAILED");}, this);
    managerApi.isBadRequest = ko.computed(function() {return (managerApi.status() == "BAD_REQUEST");}, this);

    // A helper function to take the parameters and either replace them in the
    // base URL or add as query string params, or leave alone
    managerApi.generateURL = function(routeName, params) {
      if(typeof api.services.ajax.routes[routeName] != "object") {
        throw "AjaxManager.generateURL(): The requested route does not exist: " + routeName;
      }
      else {
        var route = api.services.ajax.routes[routeName];
      }

      // Setup the route parameters by first extracting string-replacement parameters
      // defined in the route
      var url = prefix + route.url;

      for(var i in route.params) {
        // A required parameter (no default value) does not exist
        if(typeof params.routeData == "undefined" || !(route.params[i].name in params.routeData) &&  typeof route.params[i].defaultValue == "undefined") {
          throw "AjaxManager.generateURL: A required parameter was not included in the request: " + route.params[i].name;
        }
        else if(typeof params.routeData[route.params[i].name] != "undefined") {
          url = url.replace("{" + route.params[i].name + "}", params.routeData[route.params[i].name]);
        }
        else if(typeof route.params[i].defaultValue != "undefined") {
          url = url.replace("{" + route.params[i].name + "}", route.params[i].defaultValue);
        }
      }

      return url;
    };

    // Store any current requests
    var pendingRequests = [];

    // Use the injected ajax request and error handling to make the ajax call
    managerApi.makeRequest = function(route, params, success) {
      self.status("LOADING");

      if(pendingRequests.length > 0 && !params.isSimultaneousRequest) {
          $.each(currentRequest, function(idx, $ajaxInstance) {
              $ajaxInstance.abort();
          });
      }

      var url = self.generateURL(route.name, params);

      // Return the ajax object (if using jquery)
      // Assume makeAjaxRequest takes jquery-like parameters, otherwise expect
      // caller to implement an adapter to make it work
      currentRequest = ajax({
        url: url,
        type: route.method,
        data: params.data,

        // Set the timeout to 5 minutes - Should this be longer?
        timeout: 600000,

        // Delegate handling the data to the calling object
        success: function(data, textStatus, jqXHR){
          self.status("OK");
          currentRequest = null;
          return success(data);
        },
        statusCode: {
          400: function(jqXHR, textStatus, errorThrown){
              self.status("BAD_REQUEST");
              currentRequest = null;
              return badRequestHandler(jqXHR, textStatus, errorThrown);
          }
        },

        // Fire an error event to alert the page that something went wrong
        error: function(jqXHR, textStatus, errorThrown) {
          self.status("FAILED");
          currentRequest = null;
          return errorHandler(jqXHR, textStatus, errorThrown);
        }
      })

      return currentRequest;
    }

    /**
     * @params params Should be an object with {routeData: {}, queryStringData: {}, postData: {}}
     */
    managerApi.request = function(routeName, params, success) {
      if(typeof api.services.ajax.routes[routeName] != "object") {
          throw "AjaxManager.request(): The requested route does not exist";
      }
      if(api.services.ajax.routes[routeName].method == "post" && !params.data) {
          throw "AjaxManager.request(): params.data must exist if you are posting.";
      }

      return self.makeRequest(api.services.ajax.routes[routeName], params, success);
    }

    /* PUBLIC API - PUBLIC PROPERTIES AND METHODS HERE (makes a convenient list) */
    this.status       = managerApi.status
    this.isOK         = managerApi.isOK
    this.isLoading    = managerApi.isLoading
    this.isFailed     = managerApi.isFailed
    this.isBadRequest = managerApi.isBadRequest

    this.generateURL = managerApi.generateURL
    this.makeRequest = managerApi.makeRequest
    this.request     = managerApi.request
  } // END AJAXMANAGER


  /**
   * Translation namespace for all objects/functions related to translation
   */
  api.services.translation = {};

  /**
   * Container for all of the translation dictionaries available.
   */
  api.services.translation.dictionary = {en:{}};

  api.addDictionary = function(dict) {
      // This will overwrite existing entries with the new dictionary
      api.services.translation.dictionary = $.extend(true, {}, dict, api.services.translation.dictionary);
  }

  /**
   * Use the global settings for the localization settings, but set no dictionary
   * by default.
   */
  api.services.translation.defaultConfig = {
    // Use the global locale
    locale: api.config.locale,
    // Use the global date/number format localization
    dateNumberLocalization: api.config.dateAndNumberFormatLocalization
  };

  /**
   * The mirage translator provides symfony2-style translation based on a dictionary
   * and date/number localization.
   */
  api.services.translation.translator = function(config) {
    // Merge the new config with the default configurations
    config = $.extend({}, config, api.services.translation.defaultConfig);

    var self             = this
    var locale           = config.locale
    var dictionaries     = api.services.translation.dictionaries
    var translations     = dictionaries[locale]
    var localized_format = config.dateNumberLocalization[locale]

    /**
     * Mimics the symfony translator, which will look in the specified dictionary,
     * find the correct translation based on '.' delimited keys and replace any
     * wildcards.
     */
    self.translate = function(text, replace) {
      var keys = text.split('.');
      var trans = translations;

      // Loop through the keys and find the proper translation
      for(var j in keys) {
        if(typeof trans[keys[j]] == 'string' || typeof trans[keys[j]] == 'object') {
          trans = trans[keys[j]];
        }
        // Could not find translation, use given text
        else {
          trans = text;
        }
      }

      // Replace wildcards with the appropriate text replacement
      for(var i in replace) {
        var key = '%' + i + '%'

        // Does the text replacement need translation?
        if(!replace[i].mustTranslate) {
          trans = trans.replace(key, replace[i]);
          continue;
        }

        // Use different translation engines depending on the type
        var r = replace[i]
        var v = r.value
        if(r.type == 'date') {
          v = self.dateToLocalizedString(v);
        }
        else if(r.type == 'number') {
          v = self.numberToLocalizedNumberString(v);
        }
        else if(r.type == 'currency') {
          v = self.numberToLocalizedCurrencyString(v);
        }
        else {
          v = self.translate(v);
        }

        trans = trans.replace(key, v);
      }

      return trans;
    }

    /**
     * Translate a JS date object to a localized date string
     */
    self.dateToLocalizedString = function(dateObj) {
      if(!(dateObj instanceof Date)) {
        throw "Translator.dateToLocalizedString: tried to translate a non-date object.";
      }

      return dateObj.toString(localized_format.date.format);
    }

    /**
     * TODO: Need to implement
     */
    self.numberToLocalizedNumberString = function(num) {};

    /**
     * TODO: Need to provide a way to translate this
     */
    self.numberToLocalizedCurrencyString = function(num) {};
  };// END TRANSLATOR

  /**
   * Storage namespace, currently pertains only to HTML5, but could be other things
   * in the future
   */
  api.services.storage       = {};
  api.services.storage.HTML5 = {};

  /**
   * Default configurations for the storage manager.
   */
  api.services.storage.HTML5.defaultConfig = {
    ttl: 7*24*60*60*1000,
    namespace: "",
    storage: localStorage // HTML5 storage object
  };

  /**
   *
   */
  api.services.storage.HTML5.manager = function(config) {
    // Merge the new config with the default configurations
    config = $.extend(config, api.services.storage.HTML5.defaultConfig);

    /**
     * Sub-object that wraps saved values to capture created time, ttl, and the
     * value of the object being saved
     */
    var metaDataWrapper = function(value, ttl) {
      var now = new Date();

      this.created = now.getTime();
      this.ttl     = ttl;
      this.value   = value;
    };

    var storageApi = {};

    // Store the Time To Live (TTL) default as 1 week
    var ttl       = config.ttl;
    var namespace = config.namespace;
    var storage   = config.storage;

    // Check if this feature is supported
    var isStorageAvailable = (typeof localStorage == "object" && localStorage != null) && (typeof sessionStorage == "object" && sessionStorage != null);

    // Prevent saving new items if we are maxed out
    var maxedOut   = false;
    var isMaxedOut = function(){return isMaxedOut};

    // Store the object in the metadata wrapper and return true upon succesful save
    storageApi.save = function(key, value) {
      if(maxedOut) return false;

      var w = new metaDataWrapper(value, ttl);
      storage[key] = JSON.stringify(w);

      try {
        w = new metaDataWrapper(value, ttl);
        storage[key] = JSON.stringify(w);
      }
      // Storage has reached it's limit
      catch(e){
        if(e == "QUOTA_EXCEEDED_ERR") {
          maxedOut = true;
          return false;
        }
        else {
          throw e;
        }
      }

      return true;
    };

    // Get the object, check the TTL, and return the value object
    storageApi.get = function(key) {
      var badValues = {'null': true, 'undefined': true, 'false': true};
      var type = typeof storage[key];
      if(type == 'undefined' || badValues[type]) return null;

      var o = JSON.parse(storage[key]);

      // Check the type of the object
      var created = Number(o.created);
      var ttl     = Number(o.ttl);
      if(typeof o != "object" || created == 0 || isNaN(created) || isNaN(ttl)) {
        return null;
      }

      // Check if it has exceeded it's time to live'
      var d = new Date();
      if(d.getTime() -  created > ttl) {
        storageApi.remove(key);
        return null;
      }

      // Unwrap and return the base value
      return o.value;
    }

    // Use the storage API to remove the key/clear
    // Unset the maxed out flag
    storageApi.remove = function(key) {
      storage.removeItem(key);
      maxedOut = false;
    };
    storageApi.clear = function() {
      storage.clear();
      maxedOut = false;
    };

    // Return the public API as a single function that does standard feature checks
    var apiAccessor = function(method, key, value) {
      if(typeof method != 'string' || typeof api[method] != 'function') {
        throw "StorageManager: Method was not a string or does not exist, got type: " + (typeof method);
      }

      if(!isStorageAvailable) return false;

      var nskey = namespace + key;

      return storageApi[method](nskey, value);
    }

    // Add configuration methods outside the accessor
    apiAccessor.isMaxedOut = isMaxedOut;

    return apiAccessor;
  };


  /**
   * Validation namespace which includes the validator and the standard constraints
   */
  api.services.validation = {};

  /**
   * Date/number format for the constraint engine
   */
  api.services.validation.defaultConfig = {

  };

  /**
   * Validation engine that uses the standard constraints, plus any user-specified
   * constraints to validate an object.
   */
  api.services.validation.validator = function(config) {
    var self = this;

    // No use yet, but leaving just in case
    config = $.extend(config, api.services.validation.defaultConfig);

    var translator   = api.get.service('translator');
    self.constraints = api.services.validation.constraints();

    /**
     * Loop through all of the enumerable properties of an entity and validate
     * them against the constraints
     */
    self.isEntityValid = function(entity) {
      var isValid = true;

      // Loop through all of the properties and validate
      for(var i in entity) {
        // This check for entity standard properties is purely for IE8 support
        var stdProps = ['errors', 'constraints', 'hasError'];
        var skip = false;
        for(var j in stdProps) {
          if(i == stdProps[j]) skip = true;
        }

        // Skip standard properties
        if(skip) continue;

        // Validate that property
        var errors = self.isValid(entity[i](), entity.constraints[i]);

        // Clear existing errors
        entity.errors[i].removeAll();

        // Add new errors to the error object
        for(var j in errors) {
          entity.errors[i].push(errors[j]);
        }

        if(errors.length > 0) isValid = false;
      }

      return isValid;
    }

    // Public method to validate an object/literal via a list of constraints
    self.isValid = function(subject, constraintList) {
      var errors = [];
      var msg = "";

      for(var i in constraintList) {
        msg = hasError(subject, constraintList[i]);
        if(msg) {
          errors.push(msg)

          // Short circuit execution unless explicitly told otherwise
          if(!constraintList[i].continueOnFail) break;
        }
      }

      return errors;
    }

    // Private function that actually does the validation
    var hasError = function(subject, c) {
      var validate = null;

      if(typeof c.constraint == "function") {
          validate = c.constraint;
      }
      else if(typeof c.constraint == "string") {
        // Loop through the constraints and find the std constraint to use
        for(var name in self.constraints) {
          if(c.constraint == name) {
            validate = self.constraints[name];
            break;
          }
        }
      }

      // Validator not found
      if(validate == null) throw "Validator: Constraint not found: " + c.constraint;

      try {
        validate(subject, c.params);
        return false;
      }
      catch(e) {
        if(typeof e.error != 'string') throw e;
        return translator.translate(e.error, c.msgTranslations);
      }
    }
  };// END VALIDATOR

  // Standard constraints
  api.services.validation.constraints = function(config) {
    var self = this;
    var dateNumberFormat = config.dateAndNumberFormatLocalization;

    self.notNull = function(subject) {
      if(subject !== null && subject !== undefined) {
        return true;
      }
      else {
        throw {error:"errors.form.not_null"};
      }
    };

    self.minLength = function(subject, min) {
      if(typeof subject != "string") {
        throw {error:"errors.form.wrongtype"};
      }
      else if(subject.length < min) {
        throw {error:"errors.form.minLength"}
      }
      else {
        return true;
      }
    }

    self.maxLength = function(subject, max) {
      if(typeof subject != "string") {
        throw {error:"errors.form.wrongtype"};
      }
      else if(subject.length > max) {
        throw {error:"errors.form.minLength"};
      }
      else {
        return true;
      }
    };

    self.type = function(subject, type) {
      if(type == "null" && subject !== null || typeof subject != type) {
        throw {error:"errors.form.type"};
      }
      else {
        return true;
      }
    };

    // DATE Constraints

    self.date = function(subject, params) {
      if(!dateNumberFormat.date.pattern.test(subject)) throw {error:"errors.form.date.invalid_format"};

      // Y/M/d value validation
      var test  = Date.parseExact(subject, dateNumberFormat.date.format)

      if(test === null) throw {error:"errors.form.date.invalid_format"};

      var year  = test.getFullYear();
      var month = test.getMonth();
      var day   = test.getDay() + 1; // 0 indexed for day of month

      try {
        Date.validateDay(day, year, month);
      }
      catch(e) {
        throw {error:"errors.form.date.invalid_format"};
      }

      return true;
    };

    self.minDate = function(subject, params) {
      var min  = params.minDate;
      var test = Date.parseExact(subject, dateNumberFormat.date.format);

      if(test < min) throw {error: "errors.form.date.min_date"};
      return true;
    };

    self.maxDate = function(subject, params) {
      var max  = params.maxDate;
      var test = Date.parseExact(subject, dateNumberFormat.date.format);
      if(test > max) throw {error: "errors.form.date.max_date"};

      return true;
    };
  }; // End CONSTRAINTS

  // Return mirage's public API
  return api;
})();

if(typeof module == "object") {
  module.exports = solum;
}