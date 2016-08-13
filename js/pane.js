/* global wp, jQuery, console, CustomizerDevTools */
( function( component, api, $ ) {
	'use strict';

	/**
	 * Expose Customizer preview window and wp.customize object persistently, even as iframe window is destroyed with each refresh.
	 *
	 * @returns {void}
	 */
	component.capturePreviewObjects = function capturePreviewObjects() {
		var onWindowChange = function( win ) {
			try {
				component.previewWindow = win;
				component.previewCustomize = component.previewWindow.wp.customize;
			} catch ( error ) {
				console.info( 'The wp.customize object from the customizer preview cannot be exposed as CustomizerDevTools.previewCustomize in the parent frame due to a cross-domain security restriction.', error );
				component.previewWindow = null;
				component.previewCustomize = null;
				api.previewer.targetWindow.unbind( onWindowChange );
			}
		};

		api.previewer.targetWindow.bind( onWindowChange );
		if ( api.previewer.targetWindow.get() ) {
			onWindowChange( api.previewer.targetWindow.get() );
		}
	};

	component.wrapFunction( {
		prototype: api.Previewer.prototype,
		objectType: 'messenger.previewer',
		methodName: 'trigger',
		methodDisplayName: 'receive'
	} );

	component.wrapFunction( {
		prototype: api.Previewer.prototype,
		objectType: 'messenger.previewer',
		methodName: 'send'
	} );

	api.bind( 'ready', function() {
		component.capturePreviewObjects();
	} );

	api.bind( 'add', component.handleAddition );
	api.panel.bind( 'add', component.handleAddition );
	api.section.bind( 'add', component.handleAddition );
	api.control.bind( 'add', component.handleAddition );

} )( CustomizerDevTools, wp.customize, jQuery );
