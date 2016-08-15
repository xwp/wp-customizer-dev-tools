/* global wp, CustomizerDevTools, console */
( function( component, api ) {
	'use strict';

	component.wrapValuesMethods({
		object: api,
		name: 'setting',
		ignoreUntilReady: true
	});
	component.wrapValuesMethods({
		object: api.selectiveRefresh.partial,
		name: 'partial',
		ignoreUntilReady: true
	});

	component.wrapTriggerMethod({
		object: api,
		name: 'events',
		filter: function( id ) {
			return ! ( 'add' === id || 'change' === id || 'remove' === id );
		}
	});

	component.wrapMessengerMethods({
		object: api.Preview.prototype,
		name: 'messenger.preview'
	});

	// @todo Add inspection of selective refresh events.

	api.bind( 'preview-ready', function() {
		api.preview.bind( 'dev-tools-start-logging', function startLoggingPreview( serializedLoggingFilterPatterns ) {
			var loggingFilterPatterns;
			try {
				loggingFilterPatterns = component.parseSerializedLoggingFilterPatterns( serializedLoggingFilterPatterns );
				sessionStorage.setItem( component.loggingPatternFiltersStorageKey, serializedLoggingFilterPatterns );
				component.loggingFilterPatterns = loggingFilterPatterns;
			} catch ( err ) {
				console.error( err );
			}
		} );

		api.preview.bind( 'dev-tools-stop-logging', function() {
			sessionStorage.removeItem( component.loggingPatternFiltersStorageKey );
			component.loggingFilterPatterns = [];
		} );
	} );

} )( CustomizerDevTools, wp.customize );
