/* global wp, jQuery, console, CustomizerDevTools */
( function( component, api, $ ) {
	'use strict';

	api.bind( 'ready', function() {
		component.capturePreviewObjects();
	} );

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

	component.wrapValuesMethods({
		object: api,
		name: 'setting',
		ignoreUntilReady: true
	});
	component.wrapValuesMethods({
		object: api.panel,
		name: 'panel',
		ignoreUntilReady: true
	});
	component.wrapValuesMethods({
		object: api.section,
		name: 'section',
		ignoreUntilReady: true
	});
	component.wrapValuesMethods({
		object: api.control,
		name: 'control',
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
		object: api.Previewer.prototype,
		name: 'messenger.previewer'
	});

	api.bind( 'add', component.addSettingChangeListener );

} )( CustomizerDevTools, wp.customize, jQuery );
