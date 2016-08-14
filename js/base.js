/* global wp, jQuery, console */
/* exported CustomizerDevTools */

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
	 * @param {object} args
	 * @param {wp.customize.Values} args.object
	 * @param {string} args.name
	 * @param {boolean} args.ignoreUntilReady
	 */
	component.wrapValuesMethods = function wrapValuesObjectMethod( args ) {
		var originalMethods;

		originalMethods = {
			add: args.object.add,
			remove: args.object.remove
		};

		_.each( originalMethods, function( method, methodName ) {
			args.object[ methodName ] = function() {
				var params, namespace, id, item, consoleArgs = [];

				// Remove a lot of noise for addition of initial values.
				if ( ! component.ready && args.ignoreUntilReady ) {
					return method.apply( this, arguments );
				}

				params = Array.prototype.slice.call( arguments );
				id = params[0];
				item = params[1];
				namespace = [ 'customizer', component.context, args.name, methodName ];
				consoleArgs.push( {
					'format': '[%s]',
					'value': namespace.join( '.' )
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
				console.log.apply(
					console,
					[
						_.pluck( consoleArgs, 'format' ).join( ' ' )
					].concat(
						_.pluck( consoleArgs, 'value' )
					)
				);
				return method.apply( this, arguments );
			};
		} );
	};

	/**
	 * Wrap trigger method.
	 *
	 * @param {object} args
	 * @param {object} args.object
	 * @param {string} [args.name]
	 * @param {function} [args.filter]
	 */
	component.wrapTriggerMethod = function wrapTriggerMethod( args ) {
		var originalTrigger = args.object.trigger;
		args.object.trigger = function trigger() {
			var consoleArgs = [], id, params, namespace = [ 'customizer', component.context ];
			if ( args.filter && ! args.filter.apply( this, arguments ) ) {
				return originalTrigger.apply( this, arguments );
			}
			if ( args.name ) {
				namespace.push( args.name );
			}
			namespace.push( 'trigger' );

			consoleArgs.push( {
				'format': '[%s]',
				'value': namespace.join( '.' )
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

			console.log.apply(
				console,
				[
					_.pluck( consoleArgs, 'format' ).join( ' ' )
				].concat(
					_.pluck( consoleArgs, 'value' )
				)
			);

			return originalTrigger.apply( this, arguments );
		};
	};

	/**
	 * Wrap messenger methods.
	 * @param {object} args
	 * @param {wp.customize.Messenger} args.object
	 * @param {string} args.name
	 * @param {function} [args.filter]
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
				var params, namespace, id, item, consoleArgs = [];

				params = Array.prototype.slice.call( arguments );
				id = params[0];
				namespace = [ 'customizer', component.context, args.name ];
				namespace.push( methodParams.name || methodName );
				consoleArgs.push( {
					'format': '[%s]',
					'value': namespace.join( '.' )
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
				console.log.apply(
					console,
					[
						_.pluck( consoleArgs, 'format' ).join( ' ' )
					].concat(
						_.pluck( consoleArgs, 'value' )
					)
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
	 */
	component.addSettingChangeListener = function addSettingChangeListener( setting ) {
		setting.bind( function onSettingChange( newDataArg, oldDataArg ) {
			var newData = _.clone( newDataArg ), oldData = _.clone( oldDataArg );
			if ( $.isPlainObject( newData ) && $.isPlainObject( oldData ) ) {
				_.each( _.keys( newData ), function( key ) {
					if ( _.isEqual( newData[ key ], oldData[ key ] ) ) {
						delete newData[ key ];
						delete oldData[ key ];
					}
				} );
			}

			console.log(
				'[customizer.%s.setting.change] %s\n- %s\n+ %s',
				component.context,
				setting.id,
				JSON.stringify( oldData ),
				JSON.stringify( newData )
			);
		} );
	};

	return component;

} )( wp.customize, jQuery );
