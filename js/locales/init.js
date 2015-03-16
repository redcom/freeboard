/**
 * Detection and loading the localization files
 * If browser language can not be loaded browser console window will log this
 * By defaults if the browser language is not present it will load en.json
 * This loads the jquery validation languages files
 */
(function($) {
    'use strict';

    var currentBrowserLanguage = $.i18n.detectLanguage(),
        path = "/js/locales/__lng__.json";


    $.i18n.debug = true;


    var options = {
        resGetPath: path,
        lowerCaseLng: true,
        fallbackLng: 'en',
        lng: currentBrowserLanguage
    };

    $.i18n.init(options, function(t) {
        $('html').i18n();
    });

    // load validation languages
    var validationLanguagesPath = "/js/locales/validation/jquery.validationEngine-XX.js",
        validationPath = validationLanguagesPath.replace('XX', currentBrowserLanguage.split('-')[0].toLowerCase());

    $.getScript(validationPath);

}(jQuery));
