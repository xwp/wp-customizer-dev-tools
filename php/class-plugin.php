<?php
/**
 * Customizer Dev Tools Plugin Class
 *
 * @package CustomizerDevTools
 */

namespace CustomizerDevTools;

/**
 * Class Customize_Posts_Plugin
 */
class Plugin {

	/**
	 * Plugin version.
	 *
	 * @var string
	 */
	public $version;

	/**
	 * Plugin constructor.
	 *
	 * @access public
	 */
	public function __construct() {
		if ( preg_match( '/Version:\s*(\S+)/', file_get_contents( __DIR__ . '/../customizer-dev-tools.php' ), $matches ) ) {
			$this->version = $matches[1];
		}
	}

	/**
	 * Init.
	 */
	public function init() {
		load_plugin_textdomain( 'customizer-dev-tools' );

		add_action( 'wp_default_scripts', array( $this, 'register_scripts' ), 11 );
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'enqueue_controls_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_preview_scripts' ) );
	}

	/**
	 * Register scripts.
	 *
	 * @param \WP_Scripts $wp_scripts Scripts.
	 */
	public function register_scripts( \WP_Scripts $wp_scripts ) {
		$base_handle = 'customizer-dev-tools-base';
		$src = plugins_url( 'js/base.js', __DIR__ );
		$deps = array( 'customize-base' );
		$in_footer = 0;
		$wp_scripts->add( $base_handle, $src, $deps, $this->version, $in_footer );
		$wp_scripts->registered['customize-controls']->deps[] = $base_handle;
		$wp_scripts->registered['customize-preview']->deps[] = $base_handle;

		$handle_pane = 'customizer-dev-tools-pane';
		$src = plugins_url( 'js/pane.js', __DIR__ );
		$deps = array( 'customize-controls' );
		$in_footer = 0;
		$wp_scripts->add( $handle_pane, $src, $deps, $this->version, $in_footer );

		$handle_preview = 'customizer-dev-tools-preview';
		$src = plugins_url( 'js/preview.js', __DIR__ );
		$deps = array( 'customize-preview', 'customize-selective-refresh' );
		$in_footer = 0;
		$wp_scripts->add( $handle_preview, $src, $deps, $this->version, $in_footer );
	}

	/**
	 * Enqueue pane (controls) scripts.
	 */
	public function enqueue_controls_scripts() {
		wp_add_inline_script( 'customizer-dev-tools-base', 'CustomizerDevTools.context = "pane";', 'after' );
		wp_enqueue_script( 'customizer-dev-tools-pane' );
	}

	/**
	 * Enqueue preview scripts.
	 */
	public function enqueue_preview_scripts() {
		if ( ! is_customize_preview() ) {
			return;
		}
		wp_add_inline_script( 'customizer-dev-tools-base', 'CustomizerDevTools.context = "preview";', 'after' );
		wp_enqueue_script( 'customizer-dev-tools-preview' );
	}
}
