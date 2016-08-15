/* global wp, jQuery, console, JSON */
/* exported CustomizerDevTools */
/* eslint no-magic-numbers: [ "error", { "ignore": [0,1,2] } ] */

var CustomizerDevTools = ( function( api, $ ) {
	'use strict';

	var component = {
		ready: false,
		context: 'unknown'
	};

	api.bind( 'ready', function() {
		component.ready = true;
	} );

	/**
	 * Log.
	 *
	 * @param {object} args Args.
	 * @param {Array} args.namespace Namespace parts.
	 * @param {Array} args.params Params.
	 * @return {void}
	 */
	component.log = function log( args ) {
		var namespace, consoleArgs;
		namespace = [ 'customizer', component.context ].concat( args.namespace );
		consoleArgs = [];
		consoleArgs.push( '[' + namespace.join( '.' ) + ']' );
		_.each( args.params, function( param ) {
			consoleArgs[0] += ' ' + ( param.format || '%s' );
			if ( param.values ) {
				consoleArgs = consoleArgs.concat( param.values );
			} else {
				consoleArgs.push( param.value );
			}
		} );
		console.log.apply( console, consoleArgs );
	};

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
				var params, id, item, consoleParams = [];

				// Remove a lot of noise for addition of initial values.
				if ( ! component.ready && args.ignoreUntilReady ) {
					return method.apply( this, arguments );
				}

				params = Array.prototype.slice.call( arguments );
				id = params[0];
				item = params[1];
				consoleParams.push( {
					value: id,
					format: '%o'
				} );

				if ( 'add' === methodName ) {
					consoleParams.push( {
						value: item,
						format: '%O'
					} );
				}

				component.log({
					namespace: [ args.name, methodName ],
					params: consoleParams
				});

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
			var consoleParams = [], id, params, namespaceParts = [];
			if ( args.filter && ! args.filter.apply( this, arguments ) ) {
				return originalTrigger.apply( this, arguments );
			}
			if ( args.name ) {
				namespaceParts.push( args.name );
			}
			namespaceParts.push( 'trigger' );

			params = Array.prototype.slice.call( arguments );
			id = params[0];

			consoleParams.push( {
				value: id,
				format: '%o'
			} );
			if ( params.length > 1 ) {
				consoleParams.push( {
					format: '%O',
					value: params.slice( 1 )
				} );
			}

			component.log({
				namespace: namespaceParts,
				params: consoleParams
			});

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
			args.object[ methodName ] = function() { // eslint-disable-line complexity
				var params, namespaceParts, namespace, id, consoleParams = [];

				params = Array.prototype.slice.call( arguments );
				id = params[0];
				namespaceParts = [ args.name, methodParams.name || methodName ];

				consoleParams.push( {
					format: '%o',
					value: id
				} );
				if ( 2 === params.length ) {
					consoleParams.push( {
						'format': '( %o )',
						'value': params[1]
					} );
				} else if ( params.length > 1 ) {
					consoleParams.push( {
						'format': '( %O )',
						'value': params.slice( 1 )
					} );
				}

				component.log({
					namespace: namespaceParts,
					params: consoleParams
				});

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

			component.log({
				namespace: [ 'setting', 'change' ],
				params: [
					{
						values: [ setting.id, JSON.stringify( oldValue ), JSON.stringify( newValue ) ],
						format: '%o\n- %s\n+ %s'
					}
				]
			});

			return originalFireWith.call( setting.callbacks, object, args );
		};
	};

	return component;

} )( wp.customize, jQuery );
