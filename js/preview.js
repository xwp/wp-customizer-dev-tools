/* global wp, CustomizerDevTools */
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

} )( CustomizerDevTools, wp.customize );
