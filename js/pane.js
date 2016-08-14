/* global wp, console, CustomizerDevTools */
( function( component, api ) {
	'use strict';

	api.bind( 'ready', function() {
		component.capturePreviewObjects();
		component.watchState( api.state );
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

	/**
	 * Watch state.
	 *
	 * @param {wp.customize.Values} state State.
	 * @param {function} state.each Iterator method.
	 * @param {function} state.has Add method.
	 * @param {function} state.add Add method.
	 * @returns {void}
	 */
	component.watchState = function watchState( state ) {
		var originalAdd = state.add;

		// Watch existing state values.
		state.each( function( stateValue, id ) {
			component.watchStateValue( id, stateValue );
		} );

		/**
		 * Wrap the state.add method since the state ID is not exposed in the add event.
		 *
		 * @param {string} id State ID.
		 * @param {wp.customize.Value} stateValue Value.
		 * @param {function} stateValue.get Getter.
		 * @returns {void}
		 */
		state.add = function addState( id, stateValue ) {
			if ( ! state.has( id ) ) {
				console.log( '[customizer.%s.state.add]', component.context, id, stateValue.get() );
				component.watchStateValue( id, stateValue );
			}
			originalAdd.call( this, id, stateValue );
		};
	};

	/**
	 * Watch state value.
	 *
	 * @param {string} id State ID.
	 * @param {wp.customize.Value} stateValue State value.
	 * @param {function} stateValue.bind Change watch adder.
	 * @returns {void}
	 */
	component.watchStateValue = function watchStateValue( id, stateValue ) {
		stateValue.bind( function( newState, oldState ) {
			console.log( '[customizer.%s.state.change]', component.context, id, oldState, '=>', newState );
		} );
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

} )( CustomizerDevTools, wp.customize );
