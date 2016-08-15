/* global wp, jQuery, console, JSON */
/* exported CustomizerDevTools */
/* eslint no-magic-numbers: [ "error", { "ignore": [0,1] } ] */

var CustomizerDevTools = ( function( api, $ ) {
	'use strict';

	// @todo DONE. Wrap the Values.add and Values.remove methods for panels, sections, controls, settings, partials.
	// @todo DONE. Wrap the send and receive (trigger) methods on Previewer and Preview.
	// @todo DONE. Wrap the trigger method on wp.customize.
	// @todo Wrap the active and expanded states on panels, sections, and controls.
	// @todo Wrap the set method on settings, or add change event.

	var component = {
		ready: false,
		context: 'unknown'
	};

	api.bind( 'ready', function() {
		component.ready = true;
	} );

	/**
	 * Wrap the add and remove methods.
	 *
	 * @this {wp.customize.Values}
	 * @param {object} args Args.
	 * @param {wp.customize.Values} args.object Object.
	 * @param {string} args.name Name.
	 * @param {boolean} args.ignoreUntilReady Ignore until ready.
	 * @returns {void}
	 */
	component.wrapValuesMethods = function wrapValuesObjectMethod( args ) {
		var originalMethods;

		originalMethods = {
			add: args.object.add,
			remove: args.object.remove
		};

		_.each( originalMethods, function( method, methodName ) {
			args.object[ methodName ] = function() {
				var params, namespaceParts, namespace, id, item, consoleArgs = [];

				// Remove a lot of noise for addition of initial values.
				if ( ! component.ready && args.ignoreUntilReady ) {
					return method.apply( this, arguments );
				}

				params = Array.prototype.slice.call( arguments );
				id = params[0];
				item = params[1];
				namespaceParts = [ 'customizer', component.context, args.name, methodName ];
				consoleArgs.push( {
					'format': '[%s]',
					'value': namespaceParts.join( '.' )
				} );
				consoleArgs.push( {
					'format': '%s',
					'value': id
				} );
				if ( 'add' === methodName ) {
					consoleArgs.push( {
						'format': '%O',
						'value': item
					} );
				}
				namespace = _.pluck( consoleArgs, 'format' ).join( ' ' );
				console.log.apply(
					console,
					[ namespace ].concat( _.pluck( consoleArgs, 'value' ) )
				);
				return method.apply( this, arguments );
			};
		} );
	};

	/**
	 * Wrap trigger method.
	 *
	 * @param {object} args Args.
	 * @param {object} args.object Object.
	 * @param {string} [args.name] Name.
	 * @param {function} [args.filter] Filter.
	 * @returns {void}
	 */
	component.wrapTriggerMethod = function wrapTriggerMethod( args ) {
		var originalTrigger = args.object.trigger;
		args.object.trigger = function trigger() { // eslint-disable-line complexity
			var consoleArgs = [], id, params, namespaceParts = [ 'customizer', component.context ], namespace;
			if ( args.filter && ! args.filter.apply( this, arguments ) ) {
				return originalTrigger.apply( this, arguments );
			}
			if ( args.name ) {
				namespaceParts.push( args.name );
			}
			namespaceParts.push( 'trigger' );

			consoleArgs.push( {
				'format': '[%s]',
				'value': namespaceParts.join( '.' )
			} );

			params = Array.prototype.slice.call( arguments );
			id = params[0];

			consoleArgs.push( {
				'format': '%s',
				'value': id
			} );
			if ( params.length > 1 ) {
				consoleArgs.push( {
					'format': '%O',
					'value': params.slice( 1 )
				} );
			}

			namespace = _.pluck( consoleArgs, 'format' ).join( ' ' );
			console.log.apply(
				console,
				[ namespace ].concat( _.pluck( consoleArgs, 'value' ) )
			);

			return originalTrigger.apply( this, arguments );
		};
	};

	/**
	 * Wrap messenger methods.
	 *
	 * @param {object} args Args.
	 * @param {wp.customize.Messenger} args.object Object.
	 * @param {string} args.name Name.
	 * @param {function} [args.filter] Filter.
	 * @returns {void}
	 */
	component.wrapMessengerMethods = function wrapMessengerMethods( args ) {

		var originalMethods;

		originalMethods = {
			send: {
				method: args.object.send
			},
			trigger: {
				method: args.object.trigger,
				name: 'receive'
			}
		};

		_.each( originalMethods, function( methodParams, methodName ) {
			args.object[ methodName ] = function() {
				var params, namespaceParts, namespace, id, consoleArgs = [];

				params = Array.prototype.slice.call( arguments );
				id = params[0];
				namespaceParts = [ 'customizer', component.context, args.name ];
				namespaceParts.push( methodParams.name || methodName );
				consoleArgs.push( {
					'format': '[%s]',
					'value': namespaceParts.join( '.' )
				} );
				consoleArgs.push( {
					'format': '%s',
					'value': id
				} );
				if ( params.length > 1 ) {
					consoleArgs.push( {
						'format': '%O',
						'value': params.slice( 1 )
					} );
				}
				namespace = _.pluck( consoleArgs, 'format' ).join( ' ' );
				console.log.apply(
					console,
					[ namespace ].concat( _.pluck( consoleArgs, 'value' ) )
				);
				return methodParams.method.apply( this, arguments );
			};
		} );
	};

	/**
	 * Add setting change handler.
	 *
	 * @todo Be wary of comparing large values. Show smaller contextual diffs.
	 * @param {wp.customize.Setting|wp.customize.Value} setting Setting.
	 * @returns {void}
	 */
	component.addSettingChangeListener = function addSettingChangeListener( setting ) {

		var originalFireWith = setting.callbacks.fireWith;
		setting.callbacks.fireWith = function fireWith( object, args ) {
			var newValue = _.clone( args[0] ), oldValue = _.clone( args[1] );

			if ( $.isPlainObject( newValue ) && $.isPlainObject( oldValue ) ) {
				_.each( _.keys( newValue ), function( key ) {
					if ( _.isEqual( newValue[ key ], oldValue[ key ] ) ) {
						delete newValue[ key ];
						delete oldValue[ key ];
					}
				} );
			}

			console.log(
				'[customizer.%s.setting.change] %s\n- %s\n+ %s',
				component.context,
				setting.id,
				JSON.stringify( oldValue ),
				JSON.stringify( newValue )
			);
			return originalFireWith.call( setting.callbacks, object, args );
		};
	};

	return component;

} )( wp.customize, jQuery );
