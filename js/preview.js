/* global wp, CustomizerDevTools */
( function( component, api ) {
	'use strict';

	api.bind( 'add', component.handleAddition );
	api.selectiveRefresh.partial.bind( 'add', component.handleAddition );

	component.wrapFunction( {
		prototype: api.Preview.prototype,
		objectType: 'messenger.preview',
		methodName: 'trigger',
		methodDisplayName: 'receive'
	} );

	component.wrapFunction( {
		prototype: api.Preview.prototype,
		objectType: 'messenger.preview',
		methodName: 'send'
	} );

	// @todo Add inspection of selective refresh events.

} )( CustomizerDevTools, wp.customize );
