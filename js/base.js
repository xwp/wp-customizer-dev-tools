/* global wp, jQuery, console */
/* exported CustomizerDevTools */

var CustomizerDevTools = ( function( api, $ ) {
	'use strict';

	var component = {
		ready: false,
		originalTriggers: {
			mixin: api.Events.trigger,
			values: api.Values.prototype.trigger,
			messenger: api.Messenger.prototype.trigger
		},
		originalMessengerSend: api.Messenger.prototype.send,
		originalMessengerReceive: api.Messenger.prototype.receive,
		context: 'unknown'
	};

	/**
	 *
	 * @this {wp.customize.Class}
	 * @param {object} args
	 * @param {object} args.prototype
	 * @param {object} args.objectType
	 * @param {string} args.methodName
	 * @param {function} [args.filter]
	 * @param {function} [args.beforeTrigger]
	 * @param {string} [args.methodDisplayName]
	 */
	component.wrapFunction = function wrapFunction( args ) {
		var originalMethod = args.prototype[ args.methodName ];
		args.prototype[ args.methodName ] = function wrappedLog() {
			var scope = [ 'customizer', component.context ], params, consoleArgs = [];

			params = Array.prototype.slice.call( arguments );

			// Allow short-circuiting if not relevant.
			if ( args.filter && ! args.filter.apply( this, params ) ) {
				return originalMethod.apply( this, arguments );
			}

			// Allow custom logic to be run before triggering.
			if ( args.beforeTrigger ) {
				args.beforeTrigger.apply( this, params );
			}

			scope.push( args.objectType );
			scope.push( args.methodDisplayName || args.methodName );

			consoleArgs.push( '[' + scope.join( '.' ) + ']' );
			consoleArgs.push( params[0] );

			if ( params[1] && 'function' === typeof params[1].extended && params[1].extended( api.Class ) ) {
				if ( 'string' === typeof params[1].id ) {
					consoleArgs.push( params[1].id );
				} else if ( params[1].extended( api.Value ) ) {
					consoleArgs.push( params[1]._value );
				}
			}
			consoleArgs.push( params.slice( 1 ) );

			console.log.apply( console, consoleArgs );
			return originalMethod.apply( this, arguments );
		};
	};

	api.bind( 'ready', function() {
		component.ready = true;
	} );

	/**
	 * Handle setting addition.
	 *
	 * @param {wp.customize.Panel|wp.customize.Section|wp.customize.Control|wp.customize.Setting|wp.customize.Value} object Object..
	 */
	component.handleAddition = function handleAddition( object ) {
		var type, constructors, objectConstructorType = 'default';
		if ( object.extended( api.Panel ) ) {
			type = 'panel';
		} else if ( object.extended( api.Section ) ) {
			type = 'section';
		} else if ( object.extended( api.Control ) ) {
			type = 'control';
		} else if ( api.selectiveRefresh && object.extended( api.selectiveRefresh.Partial ) ) {
			type = 'partial';
		} else {
			type = 'setting';
		}
		if ( 'string' !== typeof object.id ) {
			throw new Error( 'Object must have an id.' );
		}
		if ( 'partial' === type ) {
			constructors = api.selectiveRefresh.partialConstructor;
		} else {
			constructors = api[ type + 'Constructor' ];
		}

		_.find( constructors, function( constructor, key ) {
			if ( object.extended( constructor ) ) {
				objectConstructorType = key;
				return true;
			} else {
				return false;
			}
		} );

		if ( 'setting' === type ) {
			component.addSettingChangeListener( object );
		}

		if ( component.ready ) {
			if ( 'setting' === type ) {
				console.log( '[customizer.%s.setting.%s.add] %s %O', component.context, objectConstructorType, object.id, object.get() );
			} else {
				console.log( '[customizer.%s.%s.%s.add] %s %O', component.context, type, objectConstructorType, object.id, object );
			}
		}
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
